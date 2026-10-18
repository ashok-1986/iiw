// tools/refresh-data.mjs
// Re-pull the IIW roster from the Google Sheet + Drive and bake it into the repo.
// Run:  npm run refresh   (needs internet; run on your machine, not the sandbox)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHEET_ID = '1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg';
const GIDS = { finalDirectory: '0', form1: '688232594', old: '293174' };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORTRAITS = path.join(ROOT, 'public', 'portraits');
const OUT = path.join(ROOT, 'src', 'data', 'nominees.json');
const gviz = (gid) => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;

// Uploads that are NOT a portrait of the person (screenshots, posters, webpages).
// Keyed by normalised name; these render the lotus mark instead. Add more as found.
const PORTRAIT_BLOCKLIST = new Set([
  'divya parakat',
  'hema yellapragada',
  'usha raghavan',
]);

const HON = new Set(['dr','prof','professor','mr','mrs','ms','mx','smt','shri','sri','capt','col','maj','cllr','councillor','rev','revd','amb','er','adv','sir','dame']);
const POST = new Set(['obe','mbe','bem','cbe','frsa','mba','phd','jp','fca','aca','msc','bsc','ba','ma']);

function parseCsv(text) {
  const rows = []; let f = '', row = [], q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const driveId = (v) => { if (!v) return null; const m = String(v).match(/[-\w]{25,}/); return m ? m[0] : null; };
const clean = (s) => String(s || '').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
// Dedup key: drop parenthetical nicknames, honorifics and post-nominals so
// "Dr (Prof) Arpita Ray", "Arpita Ray" and "Reena Ranger OBE" collapse correctly.
const nameTokens = (s) => String(s).replace(/\([^)]*\)/g, ' ').toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).filter((t) => !HON.has(t) && !POST.has(t));
const ALIAS = { 'antara rakesh tallam': 'antara tallam' };
const normName = (s) => { const k = nameTokens(s).join(' '); return ALIAS[k] || k; };

function isImageFile(file) {
  const b = fs.readFileSync(file);
  return b.length > 2 && ((b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50));
}

async function fetchCsv(gid) {
  const r = await fetch(gviz(gid));
  if (!r.ok) throw new Error('gviz ' + gid + ' ' + r.status);
  return parseCsv(await r.text());
}

async function main() {
  const [fd, fr1, old] = await Promise.all([fetchCsv(GIDS.finalDirectory), fetchCsv(GIDS.form1), fetchCsv(GIDS.old)]);
  const recs = new Map(); const order = []; const seenNames = new Map();
  const touch = (rawName) => {
    // "Name, President, Org / Role": sheet cells sometimes carry the title after a comma.
    // Real names never contain one, so everything after it is not part of the name.
    const name = String(rawName).split(',')[0];
    const k = normName(name);
    if (!k) return null;
    if (!recs.has(k)) { recs.set(k, { name: name.trim(), org: '', summary: '', fullText: '', imageId: null, sources: [], variants: new Set() }); order.push(k); }
    const e = recs.get(k);
    e.variants.add(name.trim());
    // keep the most formal-looking display name (longest) but prefer one without a trailing comma
    if (name.trim().length > e.name.length) e.name = name.trim();
    return e;
  };
  for (const r of fr1.slice(1)) {
    if (!r[0] || !r[0].trim()) continue;
    const e = touch(r[0]); if (!e) continue; e.sources.push('form1');
    e.org = e.org || clean(r[1]);
    const s = clean(r[2]); if (s) e.summary = s;
    const img = driveId(r[4]); if (img && !e.imageId) e.imageId = img;
  }
  for (const r of fd.slice(1)) {
    if (!r[1] || !r[1].trim()) continue;
    const e = touch(r[1]); if (!e) continue; e.sources.push('final-directory');
    const d = clean(r[3]); if (d && words(d) > words(e.fullText)) e.fullText = d;
    if (!e.summary && d) e.summary = d;
  }
  for (const r of old.slice(1)) {
    if (!r[2] || !r[2].trim()) continue;
    const e = touch(r[2]); if (!e) continue; e.sources.push('old');
    const b = clean(r[3]); if (b && words(b) > words(e.fullText)) e.fullText = b;
    if (!e.summary && b) e.summary = b;
    const img = driveId(r[6]); if (img && !e.imageId) e.imageId = img;
  }

  const final = order.map((k, i) => {
    const e = recs.get(k);
    // fullText is the longest bio we hold; never shorter than the card summary.
    if (words(e.summary) > words(e.fullText)) e.fullText = e.summary;
    if (PORTRAIT_BLOCKLIST.has(k)) e.imageId = null; // non-portrait upload -> lotus
    return { id: String(i + 1), name: e.name, org: e.org, summary: e.summary, fullText: e.fullText, imageId: e.imageId, sources: [...new Set(e.sources)], variants: [...e.variants] };
  });

  // report merges + possible remaining dupes (same first+last token)
  const merged = final.filter((e) => e.variants.length > 1);
  console.log('MERGED name-variants (', merged.length, '):');
  for (const e of merged) console.log('  -', e.variants.join('  ==  '));
  const byFL = new Map();
  for (const e of final) { const t = nameTokens(e.name); if (t.length < 2) continue; const key = t[0] + '|' + t[t.length - 1]; (byFL.get(key) || byFL.set(key, []).get(key)).push(e.name); }
  const poss = [...byFL.values()].filter((v) => v.length > 1);
  console.log('POSSIBLE dupes (same first+last, confirm):');
  for (const v of poss) console.log('  ?', v.join('  ==  '));

  fs.mkdirSync(PORTRAITS, { recursive: true });
  let ok = 0, miss = 0;
  for (const e of final) {
    if (!e.imageId) { e.image = null; continue; }
    const file = path.join(PORTRAITS, e.imageId + '.jpg');
    try {
      if (fs.existsSync(file) && !isImageFile(file)) fs.unlinkSync(file); // earlier failed download (HTML page)
      if (!fs.existsSync(file) || fs.statSync(file).size < 2500) {
        const r = await fetch(`https://drive.google.com/thumbnail?id=${e.imageId}&sz=w1000`);
        const buf = Buffer.from(await r.arrayBuffer());
        const okMagic = buf.length > 2500 && ((buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50));
        if (okMagic) fs.writeFileSync(file, buf);
      }
      if (fs.existsSync(file) && fs.statSync(file).size > 2500) { e.image = '/portraits/' + e.imageId + '.jpg'; ok++; }
      else { e.image = null; miss++; }
    } catch { e.image = null; miss++; }
    delete e.variants;
  }
  for (const e of final) delete e.variants;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(final, null, 1));
  console.log(`\nrefresh done: ${final.length} unique nominees | photos ${ok} | lotus fallback ${final.length - ok}`);
}
main().catch((e) => { console.error('refresh failed:', e.message); process.exit(1); });
