/**
 * Nominee schema — BOUND BY HEADER NAME, never by column letter.
 *
 * Why: the PRD's "read only cols A-F" rule is unsafe against this spreadsheet.
 * In the Form-responses and Flipbook tabs col A = timestamp and col B = personal
 * EMAIL ADDRESS, so a positional A-F allowlist would publish ~92 women's emails.
 * See DATA-RECONCILIATION.md §1.
 */

/** Leading titles and honorifics ignored for A-to-Z sorting only. */
export const SORT_TITLES = [
  'dr',
  'mrs',
  'ms',
  'mr',
  'cllr',
  'councillor',
  'prof',
  'professor',
  'baroness',
  'lady',
  'sir',
  'dame',
  'rev',
  'revd',
  'paditayin',
  'amb',
] as const;

/** Trailing honours ignored for A-to-Z sorting only. */
export const SORT_HONOURS = [
  'mbe',
  'obe',
  'cbe',
  'bem',
  'dl',
  'jp',
  'frsa',
] as const;

const SORT_TITLES_SET = new Set<string>(SORT_TITLES);
const SORT_HONOURS_SET = new Set<string>(SORT_HONOURS);

function cleanSortToken(t: string): string {
  return t.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
}

/**
 * Strips leading titles and trailing honours for A-to-Z sorting by first name.
 * Example: "Dr Harsha Jani" -> "harsha jani"
 * Example: "Cllr Anjana Patel" -> "anjana patel"
 * Example: "Zamiha Desai MBE" -> "zamiha desai"
 */
export function sortKey(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && SORT_TITLES_SET.has(cleanSortToken(tokens[0]))) {
    tokens.shift();
  }
  while (tokens.length > 1 && SORT_HONOURS_SET.has(cleanSortToken(tokens[tokens.length - 1]))) {
    tokens.pop();
  }
  return tokens.join(' ').toLowerCase();
}

/**
 * Comparator for sorting nominees A to Z by first name (ignoring titles and honours).
 * Case-insensitive, accent-insensitive. Ties broken by full display name, then id.
 */
export function compareNominees(
  a: { name: string; id: string },
  b: { name: string; id: string }
): number {
  const ka = sortKey(a.name);
  const kb = sortKey(b.name);
  const cmp = ka.localeCompare(kb, 'en', { sensitivity: 'base' });
  if (cmp !== 0) return cmp;
  const cmpName = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  if (cmpName !== 0) return cmpName;
  return a.id.localeCompare(b.id, 'en', { sensitivity: 'base' });
}

export type NomineeSource = 'final-directory' | 'form-responses';

export interface Nominee {
  id: string;
  name: string;
  /** Curator note (Final Directory col "DUE Diligence") — NOT publishable as org. */
  dueDiligence: string;
  organization: string; // empty until a real org source exists (see reconciliation §1)
  city: string;
  summary: string; // col "Description" / "Tell us about yourself"
  imageId: string | null; // Drive file id, extracted from "Image Upload" link
  imageUrl: string | null; // original https://drive.google.com/open?id= link
  image: string | null; // local hosted portrait, e.g. /portraits/<id>.jpg (preferred)
  fullText: string; // longer biography for the profile page; `summary` is the short card text
  category: string;
  consentGiven: boolean;
  compiled?: boolean;
  source: NomineeSource;
}

export type SheetRow = string[];
export interface SheetTable {
  headers: string[];
  rows: SheetRow[];
}

/** Normalise a header cell for matching ("DUE Diligence ", "ईमेल पता" → comparable key). */
function normHeader(h: string): string {
  return String(h ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Header-name column lookup; returns -1 when absent. */
export function colIndex(table: SheetTable, ...candidates: string[]): number {
  const wanted = candidates.map((c) => c.toLowerCase());
  return table.headers.findIndex((h) => {
    const n = normHeader(h);
    return n !== '' && wanted.some((w) => n === w || n.includes(w));
  });
}

/** True for the email column in ANY tab — must never be read into a Nominee. */
export function isSensitiveHeader(h: string): boolean {
  const n = normHeader(h);
  return n.includes('email') || n === 'ईमेल पता' || n.includes('phone') || n.includes('mobile') || n.includes('address');
}

const cell = (row: SheetRow, idx: number): string => (idx >= 0 ? String(row[idx] ?? '').trim() : '');

/** Pull the Drive file id out of a "https://drive.google.com/open?id=XYZ" link. */
export function extractDriveId(value: string): string | null {
  const m = String(value).match(/[?&]id=([A-Za-z0-9_-]{20,})/) || String(value).match(/^([A-Za-z0-9_-]{25,})$/);
  return m ? m[1] : null;
}

/**
 * Consent is inconsistent across tabs (reconciliation §3):
 *  - Final Directory col E stores a strict boolean (TRUE/FALSE)
 *  - Flipbook/Form tabs store free-text acknowledgement, never "TRUE"
 * Treat an explicit acknowledgement sentence as consent; treat blank/anything-else as none.
 */
export function parseConsent(value: string): boolean {
  const v = String(value).trim();
  if (!v) return false;
  if (v.toUpperCase() === 'TRUE') return true;
  if (v.toUpperCase() === 'FALSE') return false;
  return /acknowledge|provide consent|consent for the collection|agree/i.test(v);
}

export function slugify(name: string, id: string): string {
  const kebab = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${kebab}-${id}`;
}

export function getInitials(name: string): string {
  return name
    .replace(/\(([^)]*)\)/g, '$1') // "Anupama(Annu) Sharma" -> "Anupama Annu Sharma"
    .split(/\s+/)
    .filter((w) => /[A-Za-z\u0900-\u097F]/.test(w) && !/^(dr|prof|mrs|mr|ms)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Map one sheet row to a Nominee using header names, dropping sensitive columns. */
export function mapSheetRow(table: SheetTable, row: SheetRow, source: NomineeSource, rowIndex: number): Nominee | null {
  const nameIdx = colIndex(table, 'nominee name', 'name', 'your name');
  const descIdx = colIndex(table, 'executive summary', 'description', 'tell us about yourself');
  const consentIdx = colIndex(table, 'consent');
  const imgIdx = colIndex(table, 'image link', 'image upload');
  const ddIdx = colIndex(table, 'due diligence', 'reason or due diligence');
  const orgIdx = colIndex(table, 'key focus', 'organization', 'organisation', 'org');
  const cityIdx = colIndex(table, 'city');
  const catIdx = colIndex(table, 'category');
  const srIdx = colIndex(table, 'sr no', 'sr.', 'id');

  const name = cell(row, nameIdx);
  if (!name) return null; // blank padding rows (Final Directory has ~1000 of these)

  const imageUrl = cell(row, imgIdx);
  return {
    id: cell(row, srIdx) || String(rowIndex + 2),
    name,
    dueDiligence: cell(row, ddIdx),
    organization: cell(row, orgIdx),
    city: cell(row, cityIdx),
    summary: cell(row, descIdx),
    fullText: cell(row, descIdx),
    imageUrl: imageUrl || null,
    image: null,
    imageId: imageUrl ? extractDriveId(imageUrl) : null,
    category: cell(row, catIdx).toLowerCase(),
    consentGiven: parseConsent(cell(row, consentIdx)),
    compiled: false,
    source,
  };
}
