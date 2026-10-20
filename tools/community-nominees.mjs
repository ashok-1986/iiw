// tools/community-nominees.mjs
// Offline patch to append/update the community nominees (IDs 89 to 96) from tools/data/community-nominees.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COMMUNITY_FILE = path.join(ROOT, 'tools', 'data', 'community-nominees.json');
const NOMINEES_FILE = path.join(ROOT, 'src', 'data', 'nominees.json');

const HON = new Set(['dr','prof','professor','mr','mrs','ms','mx','smt','shri','sri','capt','col','maj','cllr','councillor','rev','revd','amb','er','adv','sir','dame']);
const POST = new Set(['obe','mbe','bem','cbe','frsa','mba','phd','jp','fca','aca','msc','bsc','ba','ma']);

function nameTokens(s) {
  return String(s)
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !HON.has(t) && !POST.has(t));
}

export function normName(s) {
  return nameTokens(s).join(' ');
}

export function applyCommunityNominees(nominees) {
  if (!fs.existsSync(COMMUNITY_FILE)) {
    throw new Error(`Community nominees file not found: ${COMMUNITY_FILE}`);
  }

  const communityRecords = JSON.parse(fs.readFileSync(COMMUNITY_FILE, 'utf8'));

  for (const record of communityRecords) {
    if (record.published === false) {
      continue;
    }

    const normTarget = normName(record.name);
    const matches = nominees.filter((n) => normName(n.name) === normTarget);

    if (matches.length > 1) {
      throw new Error(`Expected at most one record matching "${record.name}" (norm: "${normTarget}"), found ${matches.length}`);
    }

    if (matches.length === 1) {
      const idx = nominees.findIndex((n) => normName(n.name) === normTarget);
      // Prefer record.image if defined, falling back to existing image (e.g. from manual-portraits)
      nominees[idx] = {
        ...record,
        image: record.image ?? nominees[idx].image,
      };
    } else {
      // Append new record after existing ones
      if (nominees.some((n) => String(n.id) === String(record.id))) {
        throw new Error(`Duplicate id found when adding "${record.name}": id ${record.id} already exists`);
      }
      nominees.push({ ...record });
    }
  }

  // Ensure unique ids across all nominees
  const seenIds = new Set();
  for (const n of nominees) {
    if (seenIds.has(n.id)) {
      throw new Error(`Duplicate nominee ID detected in list: ${n.id}`);
    }
    seenIds.add(n.id);
  }

  return nominees;
}

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

// Standalone execution: node tools/community-nominees.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const nominees = JSON.parse(fs.readFileSync(NOMINEES_FILE, 'utf8'));
  applyCommunityNominees(nominees);
  nominees.sort(compareNominees);
  fs.writeFileSync(NOMINEES_FILE, JSON.stringify(nominees, null, 1));
  console.log(`Successfully applied community nominees. Total count: ${nominees.length} in ${NOMINEES_FILE}`);
}
