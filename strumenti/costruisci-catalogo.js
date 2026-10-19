#!/usr/bin/env node
/*
  Swappr - costruisce il catalogo delle carte che il sito legge (cartella catalogo/).

  Fonte: il repository ufficiale dei dati Pokémon TCG (https://github.com/PokemonTCG/pokemon-tcg-data),
  cartelle "sets" e "cards/en". Non servono librerie: basta Node 18 o più recente.

  Uso:
    node strumenti/costruisci-catalogo.js <cartella-pokemon-tcg-data> <cartella-di-uscita>
    es.  node strumenti/costruisci-catalogo.js ../pokemon-tcg-data catalogo

  Scrive due file:
    sets.json   elenco dei set, rarità, tipi, modelli degli indirizzi delle immagini e le "ultime uscite"
    carte.json  tutte le carte di ogni set: [numero, nome, rarità, tipo] (+ eccezioni rare)

  Alla fine controlla che ogni carta, ricostruita dal formato compatto, abbia ESATTAMENTE lo stesso id e gli stessi
  indirizzi immagine della fonte: se qualcosa non torna il programma si ferma con un errore.
  Dopo aver rigenerato il catalogo cambia il numero di versione (?v=) come spiegato in LEGGIMI.txt.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const out = process.argv[3];
if (!src || !out) {
  console.error('Uso: node costruisci-catalogo.js <cartella-pokemon-tcg-data> <cartella-di-uscita>');
  process.exit(1);
}

const PTCG = 'https://images.pokemontcg.io/';
const SCRY = 'https://images.scrydex.com/pokemon/';
/* come si ricostruiscono gli indirizzi delle immagini: {s}=id del set, {n}=nome file, {id}=id della carta
   s=carta piccola, l=carta grande, y=simbolo del set, g=logo del set */
const IMGS = [
  { s: PTCG + '{s}/{n}.png', l: PTCG + '{s}/{n}_hires.png', y: PTCG + '{s}/symbol.png', g: PTCG + '{s}/logo.png' },
  { s: SCRY + '{id}/small', l: SCRY + '{id}/large', y: SCRY + '{s}-symbol/symbol', g: SCRY + '{s}-logo/logo' },
];
/* dalla più rara alla più comune (serve a scegliere le carte da mostrare e a ordinare il filtro) */
const CHASE = ['Mega Hyper Rare', 'MEGA_ATTACK_RARE', 'Special Illustration Rare', 'Hyper Rare', 'Rare Secret', 'Rare Rainbow',
  'Illustration Rare', 'Shiny Ultra Rare', 'Ultra Rare', 'Rare Ultra', 'Black White Rare', 'Rare Shiny GX', 'Double Rare',
  'Rare Holo VMAX', 'Rare Holo VSTAR', 'Rare Holo V', 'Rare Holo GX', 'Rare Holo EX', 'Rare Holo ex', 'Shiny Rare', 'Rare Shiny',
  'ACE SPEC Rare', 'Rare Holo', 'Rare', 'Uncommon', 'Common'];
const SUPERTYPES = ['Pokémon', 'Trainer', 'Energy'];

const sets = JSON.parse(fs.readFileSync(path.join(src, 'sets', 'en.json'), 'utf8'));
const byId = new Map(sets.map(s => [s.id, s]));

/* set: dal più recente; a parità di data, in ordine di id */
sets.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || (a.id < b.id ? -1 : 1));

/* serie: dalla più recente (per data del primo set); "Other" in fondo */
const first = {};
sets.forEach(s => { if (!first[s.series] || s.releaseDate < first[s.series]) first[s.series] = s.releaseDate; });
const series = Object.keys(first).sort((a, b) => (a === 'Other') - (b === 'Other') || first[b].localeCompare(first[a]));

const natural = (a, b) => String(a).localeCompare(String(b), 'en', { numeric: true });
const cardsBySet = {};
const exc = {}; /* id -> nome file dell'immagine, per le rare carte in cui non coincide con il numero */
const rarSeen = new Set();
let total = 0;

const outSets = [];
for (const s of sets) {
  const file = path.join(src, 'cards', 'en', s.id + '.json');
  if (!fs.existsSync(file)) throw new Error('Mancano le carte del set ' + s.id);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  arr.sort((a, b) => natural(a.number, b.number) || natural(a.id, b.id));

  /* modello immagini del set: tutte le carte devono usare lo stesso */
  const modes = new Set(arr.map(c => (c.images.small.startsWith(SCRY) ? 1 : 0)));
  if (modes.size !== 1) throw new Error('Il set ' + s.id + ' mescola host diversi per le immagini');
  const mode = [...modes][0];

  const list = [];
  for (const c of arr) {
    const m = /^([a-z0-9]+)-(.+)$/.exec(c.id);
    if (!m || m[1] !== s.id) throw new Error('Id inatteso: ' + c.id);
    if (!/^[A-Za-z0-9_!?]{1,15}$/.test(m[2])) throw new Error('Id con caratteri non previsti: ' + c.id); /* ex10-! e ex10-? sono i due Unown speciali */
    const suffix = m[2];
    rarSeen.add(c.rarity || '');
    // eccezione: l'id o il file dell'immagine non coincidono con il numero stampato
    let stem = c.number;
    if (mode === 0) {
      const mm = /^https:\/\/images\.pokemontcg\.io\/[a-z0-9]+\/(.+)\.png$/.exec(c.images.small);
      if (!mm) throw new Error('Immagine inattesa: ' + c.images.small);
      stem = mm[1];
    }
    const tuple = [c.number, c.name, c.rarity || '', SUPERTYPES.indexOf(c.supertype)];
    if (tuple[3] < 0) throw new Error('Tipo inatteso: ' + c.supertype);
    if (suffix !== c.number || (mode === 0 && stem !== c.number)) tuple.push(suffix, stem);
    if (mode === 0 && stem !== suffix) exc[c.id] = stem;
    list.push(tuple);
    total++;
  }
  cardsBySet[s.id] = list;
  outSets.push([s.id, s.name, series.indexOf(s.series), arr.length, s.releaseDate, s.ptcgoCode || '', mode, s.printedTotal || 0]);
}

/* rarità: dalla più comune alla più rara, le altre in ordine alfabetico */
const known = CHASE.slice().reverse().filter(r => rarSeen.has(r));
const rest = [...rarSeen].filter(r => r && !CHASE.includes(r)).sort((a, b) => a.localeCompare(b));
const rarities = known.concat(rest);
const rIdx = new Map(rarities.map((r, i) => [r, i]));
for (const id of Object.keys(cardsBySet)) cardsBySet[id].forEach(t => { t[2] = t[2] ? rIdx.get(t[2]) : -1; });

/* "ultime uscite": le carte migliori del set principale più recente */
const newest = sets[0].releaseDate;
const main = sets.filter(s => s.releaseDate === newest).sort((a, b) => b.total - a.total)[0];
const rank = r => { const i = CHASE.indexOf(r); return i < 0 ? 99 : i; };
const latest = cardsBySet[main.id]
  .map(t => ({ t, k: rank(rarities[t[2]] || '') }))
  .sort((a, b) => a.k - b.k || natural(a.t[0], b.t[0]))
  .slice(0, 14).map(x => [main.id].concat(x.t));

const meta = {
  data: newest.replace(/\//g, '-'), /* data dell'ultima uscita presente */
  series, rarities, supertypes: SUPERTYPES, imgs: IMGS, exc, sets: outSets, latest,
};
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'sets.json'), JSON.stringify(meta));
fs.writeFileSync(path.join(out, 'carte.json'), JSON.stringify(cardsBySet));

/* ---------- controllo: ricostruisco ogni carta e confronto con la fonte ---------- */
function build(setRow, t) {
  const sid = setRow[0], suffix = t[4] || t[0], stem = t[5] || t[0], id = sid + '-' + suffix, tpl = IMGS[setRow[6]];
  const fill = x => x.replace('{s}', sid).replace('{n}', stem).replace('{id}', id);
  return { id, small: fill(tpl.s), large: fill(tpl.l), name: t[1], number: t[0] };
}
const back = JSON.parse(fs.readFileSync(path.join(out, 'carte.json'), 'utf8'));
const meta2 = JSON.parse(fs.readFileSync(path.join(out, 'sets.json'), 'utf8'));
let checked = 0;
for (const row of meta2.sets) {
  const orig = JSON.parse(fs.readFileSync(path.join(src, 'cards', 'en', row[0] + '.json'), 'utf8'));
  const map = new Map(orig.map(c => [c.id, c]));
  if (back[row[0]].length !== orig.length) throw new Error('Numero di carte diverso nel set ' + row[0]);
  for (const t of back[row[0]]) {
    const b = build(row, t), o = map.get(b.id);
    if (!o) throw new Error('Id ricostruito inesistente: ' + b.id);
    if (o.images.small !== b.small || o.images.large !== b.large) throw new Error('Immagine diversa per ' + b.id + ': ' + o.images.small + ' / ' + b.small);
    if (o.name !== b.name || o.number !== b.number) throw new Error('Nome o numero diversi per ' + b.id);
    checked++;
  }
}
const kb = f => (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' KB';
console.log('Set: ' + sets.length + ', carte: ' + total + ' (controllate ' + checked + ' ricostruendole una per una: tutte identiche)');
console.log('sets.json ' + kb('sets.json') + ', carte.json ' + kb('carte.json'));
console.log('Ultime uscite: ' + main.name + ' (' + main.releaseDate + ') -> ' + latest.map(l => l[2]).join(', '));
