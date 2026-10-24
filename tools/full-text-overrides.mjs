// tools/full-text-overrides.mjs
// Client-supplied lightbox / profile text for people whose longest bio in the Sheet is not the one
// they want shown. refresh-data.mjs picks fullText as the longest bio across tabs, so an edit in the
// Sheet cannot always win. Keyed by normalised name in tools/data/full-text-overrides.json; sets
// fullText only. Run offline: node tools/full-text-overrides.mjs (idempotent).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normName } from './community-nominees.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OVERRIDES_FILE = path.join(ROOT, 'tools', 'data', 'full-text-overrides.json');
const NOMINEES_FILE = path.join(ROOT, 'src', 'data', 'nominees.json');

export function applyFullTextOverrides(nominees) {
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
  for (const [name, text] of Object.entries(overrides)) {
    const target = normName(name);
    const matches = nominees.filter((n) => normName(n.name) === target);
    if (matches.length !== 1) {
      throw new Error(`Full-text override "${name}" must match exactly one record, found ${matches.length}`);
    }
    matches[0].fullText = text;
  }
  return nominees;
}

// Standalone execution: node tools/full-text-overrides.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const nominees = JSON.parse(fs.readFileSync(NOMINEES_FILE, 'utf8'));
  applyFullTextOverrides(nominees);
  fs.writeFileSync(NOMINEES_FILE, JSON.stringify(nominees, null, 1));
  console.log(`Applied full-text overrides to ${NOMINEES_FILE}`);
}
