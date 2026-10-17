import type { Nominee } from './nominee';

/**
 * Flipbook chunking — PRD: 2 profiles per physical page.
 * Desktop spread = 2 pages = 4 profiles; mobile page = 2 profiles.
 * 82 profiles -> 41 pages, 21 spreads (last spread single page if odd).
 */
export function chunkIntoPages(nominees: Nominee[], perPage = 2): Nominee[][] {
  const pages: Nominee[][] = [];
  for (let i = 0; i < nominees.length; i += perPage) {
    pages.push(nominees.slice(i, i + perPage));
  }
  return pages;
}

export function pagesToSpreads(pages: Nominee[][]): [Nominee[], Nominee[] | undefined][] {
  const spreads: [Nominee[], Nominee[] | undefined][] = [];
  for (let i = 0; i < pages.length; i += 2) {
    spreads.push([pages[i], pages[i + 1]]);
  }
  return spreads;
}
