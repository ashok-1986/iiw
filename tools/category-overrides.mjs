// tools/category-overrides.mjs
// Explicit categories for people the keyword rules in src/lib/sheets.ts (deriveCategory) misplace.
// The Sheet has no category column, so an edit there cannot fix this. Keyed by normalised name in
// tools/data/category-overrides.json. Run offline: node tools/category-overrides.mjs (idempotent).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normName } from './community-nominees.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OVERRIDES_FILE = path.join(ROOT, 'tools', 'data', 'category-overrides.json');
const NOMINEES_FILE = path.join(ROOT, 'src', 'data', 'nominees.json');

// Same keys as CATEGORY_RULES in src/lib/sheets.ts (which also rejects anything else at build).
const VALID = new Set(['health', 'education', 'enterprise', 'arts-culture', 'community', 'women-empowerment']);

export function applyCategoryOverrides(nominees) {
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
  for (const [name, category] of Object.entries(overrides)) {
    if (!VALID.has(category)) {
      throw new Error(`Category override "${name}": unknown category "${category}" (valid: ${[...VALID].join(', ')})`);
    }
    const target = normName(name);
    const matches = nominees.filter((n) => normName(n.name) === target);
    if (matches.length !== 1) {
      throw new Error(`Category override "${name}" must match exactly one record, found ${matches.length}`);
    }
    matches[0].category = category;
  }
  return nominees;
}

// Standalone execution: node tools/category-overrides.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const nominees = JSON.parse(fs.readFileSync(NOMINEES_FILE, 'utf8'));
  applyCategoryOverrides(nominees);
  fs.writeFileSync(NOMINEES_FILE, JSON.stringify(nominees, null, 1));
  console.log(`Applied category overrides to ${NOMINEES_FILE}`);
}
