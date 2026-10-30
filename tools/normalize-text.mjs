// tools/normalize-text.mjs
// Whitespace-only clean-up of Sheet text (summary, fullText). It may add, move or remove spaces and
// line breaks, never a visible character, so wording is untouched. The Sheet bios arrive with spaces
// before commas, "word.Word" run-ons, "( x )" padding, zero-width characters and the like; running
// this last in refresh-data.mjs means a refresh cannot bring them back.
// Run offline: node tools/normalize-text.mjs (idempotent).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOMINEES_FILE = path.resolve(__dirname, '..', 'src', 'data', 'nominees.json');

// digit glued to a unit word ("4years", "500plus", "£1million")
const UNIT_AFTER_DIGIT = /(\d)(plus|years?|million|billion)\b/g;

export function normalizeText(input) {
  if (typeof input !== 'string') return input;
  let t = input.replace(/\r\n?/g, '\n');
  t = t.replace(/[​‌‍⁠﻿]/g, ''); // zero-width characters
  t = t.replace(/[   ]/g, ' ');            // non-breaking and thin spaces
  t = t.replace(/\t/g, ' ');

  // brackets: "( x )" -> "(x)", ")word" -> ") word", "word(Something" -> "word (Something"
  t = t.replace(/\(\s+/g, '(').replace(/[ ]+\)/g, ')');
  t = t.replace(/\)(?=[A-Za-z])/g, ') ');
  t = t.replace(/([A-Za-z])\((?=[A-Za-z]{3})/g, '$1 (');

  // space before punctuation: " ,word" -> ", word" ; "word ," -> "word,"
  t = t.replace(/([^\s])[ ]+([,.;:!?])(?=[A-Za-z])/g, '$1$2 ');
  t = t.replace(/([^\s.,;:!?])[ ]+([,.;:!?])(?=\s|$)/g, '$1$2');

  // missing space after punctuation
  t = t.replace(/,(?=[A-Za-z])/g, ', ');
  t = t.replace(/([a-z]{2}[.!?])(?=[A-Z])/g, '$1 ');
  t = t.replace(/([a-z]) -(?=[a-z])/g, '$1-');            // "co -author"
  t = t.replace(UNIT_AFTER_DIGIT, '$1 $2');
  t = t.replace(/^([ ]*[•●▪◦·])(?=\S)/gm, '$1 ');           // "•Item" -> "• Item"

  // a line break in the middle of a sentence
  t = t.replace(/,[ ]*\n(?=[a-z])/g, ', ');

  // spaces and blank lines
  t = t.replace(/[ ]{2,}/g, ' ');
  t = t.replace(/[ ]+\n/g, '\n').replace(/\n[ ]+/g, '\n');
  t = t.replace(/\n{2,}/g, '\n');
  return t.trim();
}

export function normalizeNominees(nominees) {
  for (const n of nominees) {
    for (const k of ['summary', 'fullText']) {
      if (typeof n[k] === 'string') n[k] = normalizeText(n[k]);
    }
  }
  return nominees;
}

// Standalone execution: node tools/normalize-text.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const nominees = JSON.parse(fs.readFileSync(NOMINEES_FILE, 'utf8'));
  normalizeNominees(nominees);
  fs.writeFileSync(NOMINEES_FILE, JSON.stringify(nominees, null, 1));
  console.log(`Normalised whitespace in ${NOMINEES_FILE}`);
}
