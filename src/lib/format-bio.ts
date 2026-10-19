/**
 * Turns a nominee's raw biography (plain text from the sheet, newline-separated) into
 * typed blocks the profile page can lay out properly. The source is inconsistent:
 * bullets arrive as "•Text", "● Text", "* Text" or "- Text"; numbered items as
 * "1. Text"; section titles as short lines with no end punctuation; and some people
 * list items as bare short lines with no marker at all. All of those are normalised here.
 */
export type BioBlock =
  | { type: 'heading'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

const BULLET = /^\s*(?:[•●▪◦·*]|[-–—](?=\s))\s*/;
const NUMBERED = /^\s*\d{1,2}[.)]\s*/;
const SHORT = 60;

const isBullet = (l: string) => BULLET.test(l);
const isNumbered = (l: string) => NUMBERED.test(l);
const isShort = (l: string) =>
  l.length <= SHORT && !/[.!?,;]$/.test(l) && !isBullet(l) && !isNumbered(l) && !/https?:\/\/|www\./i.test(l);
const strip = (l: string) => l.replace(BULLET, '').replace(NUMBERED, '').trim();
const isAllCaps = (l: string) => /[A-Z]/.test(l) && l === l.toUpperCase();
const clean =(l: string) => l.replace(/:$/, '').trim();

export function formatBio(raw: string): BioBlock[] {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: BioBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (isBullet(line) || isNumbered(line)) {
      const ordered = isNumbered(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? isNumbered(lines[i]) : isBullet(lines[i]))) {
        items.push(strip(lines[i]));
        i++;
      }
      blocks.push(ordered ? { type: 'ol', items } : { type: 'ul', items });
      continue;
    }

    if (isShort(line)) {
      let j = i;
      while (j < lines.length && isShort(lines[j])) j++;
      const run = lines.slice(i, j);
      const next = lines[j];

      if (run.length >= 3) {
        // bare short lines in a row are a list; a leading "Title:" line is its heading
        if (run[0].endsWith(':') || isAllCaps(run[0])) {
          blocks.push({ type: 'heading', text: clean(run[0]) });
          blocks.push({ type: 'ul', items: run.slice(1) });
        } else {
          blocks.push({ type: 'ul', items: run });
        }
        i = j;
        continue;
      }

      // one or two short lines: the last is a section title if real content follows it
      const leadsContent = next !== undefined && (isBullet(next) || isNumbered(next) || next.length > SHORT);
      const title = run[run.length - 1];
      const titleLike = !/^I\s/.test(title) && title.split(/\s+/).length <= 8;
      if (leadsContent && titleLike && (i > 0 || line.endsWith(':') || isAllCaps(line))) {
        for (const r of run.slice(0, -1)) blocks.push({ type: 'p', text: r });
        blocks.push({ type: 'heading', text: clean(run[run.length - 1]) });
      } else {
        for (const r of run) blocks.push({ type: 'p', text: r });
      }
      i = j;
      continue;
    }

    blocks.push({ type: 'p', text: line });
    i++;
  }
  return blocks;
}
