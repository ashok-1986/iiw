/**
 * Flipbook chunking — PRD: 2 profiles per physical page.
 * Desktop spread = 2 pages = 4 profiles; mobile page = 2 profiles.
 * Generic over the row shape so the server (Nominee) and client (FlipProfile)
 * sides can both use it without leaking curator-only fields to the browser.
 */
export function chunkIntoPages<T>(items: T[], perPage = 2): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

export function pagesToSpreads<T>(pages: T[][]): [T[], T[] | undefined][] {
  const spreads: [T[], T[] | undefined][] = [];
  for (let i = 0; i < pages.length; i += 2) {
    spreads.push([pages[i], pages[i + 1]]);
  }
  return spreads;
}
