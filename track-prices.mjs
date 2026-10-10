// Raccoglie ogni settimana il prezzo medio Cardmarket (via Pokémon TCG API) e costruisce lo storico in data/history/.
// Uso: node scripts/track-prices.mjs   (variabili opzionali: OUT_DIR, MIN_EUR, KEEP, DELAY_MS, POKEMONTCG_API_KEY)
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUT = process.env.OUT_DIR || 'data/history';
const MIN = Math.round((+process.env.MIN_EUR || 3) * 100);   // traccia solo carte da almeno 3 euro
const KEEP = +process.env.KEEP || 156;                        // punti conservati per carta (circa 3 anni a cadenza settimanale)
const DELAY = +process.env.DELAY_MS || (process.env.POKEMONTCG_API_KEY ? 300 : 2200);
const API = process.env.API_BASE || 'https://api.pokemontcg.io/v2/';
const today = new Date().toISOString().slice(0, 10);
const H = { 'User-Agent': 'SwapprTracker/1.0 (https://swappr.org)', Accept: 'application/json' };
if (process.env.POKEMONTCG_API_KEY) H['X-Api-Key'] = process.env.POKEMONTCG_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; ; i++) {
    let r;
    try { r = await fetch(url, { headers: H }); }
    catch (e) { if (i >= 4) throw e; await sleep(2000 * (i + 1)); continue; }
    if (r.ok) return r.json();
    if ((r.status === 429 || r.status >= 500) && i < 4) { await sleep(2000 * (i + 1)); continue; }
    throw new Error('HTTP ' + r.status + ' ' + url);
  }
}

async function merge(id, prices) {
  const f = `${OUT}/${id}.json`;
  let prev = { d: [], c: {} };
  try { prev = JSON.parse(await readFile(f, 'utf8')); } catch {}
  const same = prev.d.at(-1) === today;
  const n0 = same ? prev.d.length - 1 : prev.d.length;      // punti precedenti a oggi
  const d = same ? prev.d.slice() : [...prev.d, today];
  const cut = Math.max(0, d.length - KEEP);
  const out = { d: d.slice(cut), c: {} };
  for (const k of new Set([...Object.keys(prev.c), ...Object.keys(prices)])) {
    const h = (prev.c[k] || []).slice(0, n0);
    while (h.length < n0) h.unshift(null);
    h.push(prices[k] ?? null);
    const t = h.slice(cut);
    if (t.some(v => v != null)) out.c[k] = t;
  }
  await mkdir(OUT, { recursive: true });
  await writeFile(f, JSON.stringify(out));
}

const sets = (await get(API + 'sets?select=id')).data.map(s => s.id);
let ok = 0;
for (const id of sets) {
  try {
    const prices = {};
    for (let p = 1; ; p++) {
      const j = await get(`${API}cards?q=${encodeURIComponent('set.id:' + id)}&page=${p}&pageSize=250&select=id,cardmarket`);
      for (const c of j.data) {
        const v = c.cardmarket?.prices?.averageSellPrice;
        if (typeof v === 'number' && Math.round(v * 100) >= MIN) prices[c.id] = Math.round(v * 100);
      }
      if (p * 250 >= j.totalCount) break;
      await sleep(DELAY);
    }
    await merge(id, prices);
    ok++;
  } catch (e) { console.error('Espansione saltata', id, e.message); }
  await sleep(DELAY);
}
console.log(`Espansioni aggiornate: ${ok} su ${sets.length}`);
if (ok === 0) process.exit(1);
