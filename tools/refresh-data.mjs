// tools/refresh-data.mjs
// Re-pull the IIW roster from the Google Sheet + Drive and bake it into the repo.
// Run:  npm run refresh   (needs internet; run on your machine, not the sandbox)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import smartcrop from 'smartcrop';
import { detectFace } from './face.mjs';
import { applyCommunityNominees } from './community-nominees.mjs';
import { applyManualPortraits } from './manual-portraits.mjs';
import { applyCategoryOverrides } from './category-overrides.mjs';
import { applyFullTextOverrides } from './full-text-overrides.mjs';
import { normalizeNominees } from './normalize-text.mjs';

const SHEET_ID = '1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg';
const GIDS = { finalDirectory: '0', form1: '688232594', old: '293174' };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORTRAITS = path.join(ROOT, 'public', 'portraits');
const OUT = path.join(ROOT, 'src', 'data', 'nominees.json');
const RAW = path.join(ROOT, '.cache', 'portraits-raw'); // uncropped downloads (gitignored)
const PORTRAIT_SIZE = 600;
const stats = { face: 0, fallback: 0 }; // crop method counts, logged at the end
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

// Sort helpers matching src/lib/nominee.ts for A-to-Z sorting by first name
const SORT_TITLES = new Set(['dr','mrs','ms','mr','cllr','councillor','prof','professor','baroness','lady','sir','dame','rev','revd','paditayin','amb']);
const SORT_HONOURS = new Set(['mbe','obe','cbe','bem','dl','jp','frsa']);

function cleanSortToken(t) {
  return String(t).toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
}

export function sortKey(name) {
  const tokens = String(name).trim().split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && SORT_TITLES.has(cleanSortToken(tokens[0]))) {
    tokens.shift();
  }
  while (tokens.length > 1 && SORT_HONOURS.has(cleanSortToken(tokens[tokens.length - 1]))) {
    tokens.pop();
  }
  return tokens.join(' ').toLowerCase();
}

export function compareNominees(a, b) {
  const ka = sortKey(a.name);
  const kb = sortKey(b.name);
  const cmp = ka.localeCompare(kb, 'en', { sensitivity: 'base' });
  if (cmp !== 0) return cmp;
  const cmpName = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  if (cmpName !== 0) return cmpName;
  return String(a.id).localeCompare(String(b.id), 'en', { sensitivity: 'base' });
}

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

// --- portraits: Drive Folder 1 + face-centred square crop --------------------------------
function loadEnv() {
  // Minimal .env.local reader so `npm run refresh` needs no extra tooling (values stay in process.env).
  const f = path.join(ROOT, '.env.local');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function listFolder1Images() {
  const key = process.env.GOOGLE_DRIVE_API_KEY, folder = process.env.GOOGLE_DRIVE_FOLDER_1_ID;
  if (!key || !folder) { console.log('Folder 1: GOOGLE_DRIVE_API_KEY / GOOGLE_DRIVE_FOLDER_1_ID not set, skipping'); return []; }
  const out = []; let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folder}' in parents and trashed=false and mimeType contains 'image/'`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType)&pageSize=200&key=${key}${pageToken ? '&pageToken=' + pageToken : ''}`;
    const r = await fetch(url);
    if (!r.ok) { console.log('Folder 1: Drive API', r.status, '- skipping'); return out; }
    const j = await r.json();
    out.push(...(j.files || [])); pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

// filename -> nominee: exact normalised name, else name tokens contained in the other, else same first+last token.
function matchScore(nomTokens, fileTokens) {
  if (!nomTokens.length || !fileTokens.length) return 0;
  if (nomTokens.join(' ') === fileTokens.join(' ')) return 3;
  const shared = nomTokens.filter((t) => fileTokens.includes(t)).length;
  if (shared >= 2 && shared >= Math.min(nomTokens.length, fileTokens.length)) return 2;
  if (nomTokens.length > 1 && fileTokens.length > 1 && nomTokens[0] === fileTokens[0] && nomTokens.at(-1) === fileTokens.at(-1)) return 2;
  return 0;
}

async function applyFolder1(final) {
  loadEnv();
  const files = await listFolder1Images();
  if (!files.length) return;
  const taken = new Set();
  let filled = 0, replaced = 0;
  const unmatched = [];
  for (const f of files) {
    const ft = nameTokens(f.name.replace(/\.[a-z0-9]+$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' '));
    let best = null, bestScore = 0;
    for (const e of final) {
      const s = matchScore(nameTokens(e.name), ft);
      if (s > bestScore) { best = e; bestScore = s; }
    }
    if (!best) { unmatched.push(f.name); continue; }
    if (taken.has(best.id)) continue; // first file per person wins
    taken.add(best.id);
    const blocked = PORTRAIT_BLOCKLIST.has(normName(best.name));
    if (!best.imageId) { best.imageId = f.id; filled++; console.log('  folder1 fill   :', best.name, '<-', f.name); }
    else if (blocked || best.__badImage) { best.imageId = f.id; replaced++; console.log('  folder1 replace:', best.name, '<-', f.name); }
  }
  console.log(`Folder 1: ${files.length} images | filled ${filled} | replaced ${replaced} | unmatched ${unmatched.length}`);
  for (const u of unmatched) console.log('  ? no nominee for file:', u);
}

async function downloadDriveImage(id) {
  const looksImage = (b) => b.length > 2500 && ((b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50) || b.slice(0, 4).toString() === 'RIFF');
  // original bytes first (needs the Drive key and a shared file), thumbnail as the fallback
  const tries = [];
  if (process.env.GOOGLE_DRIVE_API_KEY) tries.push(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${process.env.GOOGLE_DRIVE_API_KEY}`);
  tries.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`);
  for (const url of tries) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (looksImage(buf)) return buf;
    } catch { /* try next */ }
  }
  return null;
}

async function isCropped(file) {
  const m = await sharp(file, { failOn: 'none' }).metadata();
  return m.width === PORTRAIT_SIZE && m.height === PORTRAIT_SIZE;
}

// Square, centred on the most salient region (faces dominate it), so circles never cut a face off.
// smartcrop (skin/edge/saturation scoring) picks the window; sharp does the pixel work.
const sharpOps = {
  open: async (img) => { const m = await img.metadata(); return { width: m.width, height: m.height, _s: img }; },
  resample: async (im, w, h) => ({ width: Math.floor(w), height: Math.floor(h), _s: im._s }),
  getData: async (im) => {
    const { data, info } = await im._s.clone().resize(im.width, im.height, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return new smartcrop.ImgData(info.width, info.height, data);
  },
};
async function cropPortrait(rawFile, outFile) {
  // Default failOn ('warning'): a truncated download throws here so the caller can re-fetch it.
  const oriented = await sharp(rawFile).rotate().toBuffer();
  const meta = await sharp(oriented).metadata();
  let c;
  const face = await detectFace(oriented);
  if (face) {
    // head-and-shoulders window: face ~40% of the square, a little headroom above it
    const side = Math.min(Math.round(Math.max(face.w, face.h) * 2.5), meta.width, meta.height);
    const cx = face.x + face.w / 2, cy = face.y + face.h / 2;
    c = {
      width: side, height: side,
      x: Math.round(Math.min(Math.max(cx - side / 2, 0), meta.width - side)),
      y: Math.round(Math.min(Math.max(cy - side * 0.45, 0), meta.height - side)),
    };
    stats.face++;
  } else {
    ({ topCrop: c } = await smartcrop.crop(sharp(oriented), { width: 100, height: 100, ruleOfThirds: false, imageOperations: sharpOps }));
    stats.fallback++;
  }
  const buf = await sharp(oriented)
    .extract({ left: c.x, top: c.y, width: c.width, height: c.height })
    .resize(PORTRAIT_SIZE, PORTRAIT_SIZE, { fit: 'cover' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(outFile, buf); // direct write: the dev server may hold the old file open (no rename)
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

  // Profile URLs end in the id (/profile/<name>-<id>), so a re-ordered Sheet must not renumber
  // people already published: reuse each baked id by name, and give new people the next free ones.
  const prevIds = new Map();
  try {
    for (const p of JSON.parse(fs.readFileSync(OUT, 'utf8'))) prevIds.set(normName(String(p.name).split(',')[0]), String(p.id));
  } catch { /* first run: no baked data yet */ }
  let nextId = Math.max(0, ...[...prevIds.values()].map(Number)) + 1;

  const final = order.map((k) => {
    const e = recs.get(k);
    // fullText is the longest bio we hold; never shorter than the card summary.
    if (words(e.summary) > words(e.fullText)) e.fullText = e.summary;
    if (PORTRAIT_BLOCKLIST.has(k)) e.imageId = null; // non-portrait upload -> lotus
    return { id: prevIds.get(k) ?? String(nextId++), name: e.name, org: e.org, summary: e.summary, fullText: e.fullText, imageId: e.imageId, sources: [...new Set(e.sources)], variants: [...e.variants] };
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

  // Folder 1 (curated headshots, filename = person's name): fills nominees with no photo and
  // replaces the blocklisted non-portraits. Form uploads that are real portraits are kept.
  await applyFolder1(final);

  fs.mkdirSync(PORTRAITS, { recursive: true });
  fs.mkdirSync(RAW, { recursive: true });
  let ok = 0, miss = 0;
  for (const e of final) {
    delete e.variants;
    if (!e.imageId) { e.image = null; continue; }
    const file = path.join(PORTRAITS, e.imageId + '.jpg');
    const raw = path.join(RAW, e.imageId + '.jpg');
    try {
      if (!fs.existsSync(raw)) {
        // An earlier run left an uncropped original in public/: keep it as the raw source.
        if (fs.existsSync(file) && isImageFile(file) && !(await isCropped(file))) fs.copyFileSync(file, raw);
        else if (!fs.existsSync(file) || !isImageFile(file) || fs.statSync(file).size < 2500) {
          const buf = await downloadDriveImage(e.imageId);
          if (buf) fs.writeFileSync(raw, buf);
        }
      }
      for (let attempt = 0; fs.existsSync(raw); attempt++) {
        try { await cropPortrait(raw, file); break; }
        catch (err) {
          // truncated/corrupt download: drop it and fetch again (max two re-fetches)
          fs.unlinkSync(raw);
          if (attempt >= 2) throw err;
          const buf = await downloadDriveImage(e.imageId);
          if (buf) fs.writeFileSync(raw, buf);
        }
      }
      if (fs.existsSync(file) && fs.statSync(file).size > 2500) { e.image = '/portraits/' + e.imageId + '.jpg'; ok++; }
      else { e.image = null; miss++; }
    } catch (err) { console.log('  ! portrait failed', e.name, '-', err.message); e.image = null; miss++; }
  }

  // Add community nominees (89-96) and manual portraits before final write
  applyCommunityNominees(final);
  await applyManualPortraits(final);
  applyCategoryOverrides(final);
  applyFullTextOverrides(final);
  normalizeNominees(final);

  // Validate unique IDs across final list before writing output
  const seenIds = new Set();
  for (const nominee of final) {
    const id = String(nominee.id);
    if (seenIds.has(id)) {
      throw new Error(`Duplicate nominee ID detected: ${id} (${nominee.name})`);
    }
    seenIds.add(id);
  }

  // drop portraits no nominee references any more (e.g. blocklisted non-portraits)
  const used = new Set(final.filter((e) => e.image).map((e) => path.basename(e.image)));
  for (const f of fs.readdirSync(PORTRAITS)) if (!used.has(f)) fs.unlinkSync(path.join(PORTRAITS, f));

  // Sort all nominees A to Z by first name (ignoring titles and honours)
  final.sort(compareNominees);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(final, null, 1));
  console.log(`\ncrops: face-detected ${stats.face} | smartcrop fallback ${stats.fallback}`);
  console.log(`refresh done: ${final.length} unique nominees | photos ${ok} | lotus fallback ${final.length - ok}`);
}
main().catch((e) => { console.error('refresh failed:', e.message); process.exit(1); });
