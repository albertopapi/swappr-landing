// Ponte opzionale verso la Pokémon TCG API (funzione di Vercel).
// Tiene le risposte nella cache della rete di Vercel: la API vera, che spesso è lenta, viene interpellata di rado.
// Se questo file manca o non risponde, il sito chiama la API direttamente: senza il ponte tutto funziona lo stesso.
// Facoltativo: se hai una chiave gratuita di pokemontcg.io, mettila nelle variabili d'ambiente di Vercel
// con il nome POKEMONTCG_API_KEY (Project Settings, Environment Variables). Non scriverla mai nei file del sito.
'use strict';

const ORIGIN = 'https://api.pokemontcg.io/v2/';
/* secondi in cui una risposta è considerata fresca sulla rete di Vercel (poi resta usabile ancora a lungo mentre si aggiorna) */
const FRESH = { cards: 3600, sets: 86400, rarities: 604800, supertypes: 604800 };
const TIMEOUT_MS = 8500;

/* accetta solo i parametri che il sito usa, con valori ragionevoli */
const CHECK = {
  q: v => v.length > 0 && v.length <= 1500 && !/[\u0000-\u001f]/.test(v),
  select: v => /^[A-Za-z0-9_.,]{1,200}$/.test(v),
  orderBy: v => /^-?[A-Za-z0-9_.]+(,-?[A-Za-z0-9_.]+)*$/.test(v) && v.length <= 100,
  page: v => /^\d{1,4}$/.test(v) && +v >= 1,
  pageSize: v => /^\d{1,3}$/.test(v) && +v >= 1 && +v <= 250,
};

function send(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('x-swappr-proxy', '1');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', cache || 'no-store');
  res.end(JSON.stringify(body));
}

/* toglie dalla risposta tutto quello che il sito non usa (prezzi, legalità, simboli...): meno byte da scaricare */
function slim(resource, j) {
  const out = { page: j.page, pageSize: j.pageSize, count: j.count, totalCount: j.totalCount };
  const data = Array.isArray(j.data) ? j.data : [];
  if (resource === 'cards') {
    out.data = data.map(c => ({
      id: c.id, name: c.name, number: c.number, rarity: c.rarity, supertype: c.supertype,
      images: c.images ? { small: c.images.small, large: c.images.large } : undefined,
      set: c.set ? { id: c.set.id, name: c.set.name } : undefined,
      cardmarket: c.cardmarket && c.cardmarket.url ? { url: c.cardmarket.url } : undefined,
    }));
  } else if (resource === 'sets') {
    out.data = data.map(s => ({ id: s.id, name: s.name, series: s.series, total: s.total, releaseDate: s.releaseDate }));
  } else {
    out.data = data;
  }
  return out;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return send(res, 405, { error: 'method' });
    const incoming = new URL(req.url, 'http://localhost').searchParams;
    const resource = incoming.get('r') || '';
    if (!Object.prototype.hasOwnProperty.call(FRESH, resource)) return send(res, 400, { error: 'resource' });
    const target = new URL(ORIGIN + resource);
    for (const [k, v] of incoming) {
      if (k === 'r') continue;
      if (!Object.prototype.hasOwnProperty.call(CHECK, k) || !CHECK[k](v)) return send(res, 400, { error: 'param ' + k });
      target.searchParams.set(k, v);
    }

    const headers = { accept: 'application/json', 'user-agent': 'swappr.org' };
    if (process.env.POKEMONTCG_API_KEY) headers['x-api-key'] = process.env.POKEMONTCG_API_KEY;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let status, text;
    try {
      const up = await fetch(target.toString(), { signal: ctl.signal, headers });
      status = up.status;
      text = await up.text();
    } catch (e) {
      return send(res, 504, { error: 'timeout' });
    } finally {
      clearTimeout(timer);
    }

    if (status !== 200) return send(res, status === 404 ? 404 : status === 429 ? 429 : 502, { error: 'upstream', status });
    let json;
    try { json = JSON.parse(text); } catch (e) { return send(res, 502, { error: 'json' }); }
    const s = FRESH[resource];
    return send(res, 200, slim(resource, json), `public, max-age=0, s-maxage=${s}, stale-while-revalidate=${s * 24}`);
  } catch (e) {
    return send(res, 500, { error: 'internal' });
  }
};
