/**
 * Nominee schema — maps Google Sheet "Final Directory" cols A-F (82 rows).
 * HARD GUARDRAIL (PRD §Security): only these six columns may ever reach the client.
 * Column semantics are ASSUMED until first authenticated read (decision #2 in plan);
 * re-check header row against mapRow() when the API key lands.
 */
export interface Nominee {
  id: string; // col A — sheet row identity
  name: string; // col B
  organization: string; // col C (+col D detail merged for display)
  city: string; // col D (per PRD search "Kolkata" hits B/D)
  summary: string; // editorial blurb, ~120 words
  imageId: string | null; // col E — Drive file id for portrait (Folder 2)
  category: string; // col F — education/health/enterprise/... (may derive from org keywords)
}

/** Raw A-F tuple as returned by sheets.values.get "Final Directory!A2:F". */
export type RawRow = [string, string, string, string, string | null, string];

export function mapRow(row: RawRow, rowIndex: number): Nominee {
  const [id, name = '', organization = '', city = '', imageId, category = ''] = row;
  return {
    id: String(id ?? rowIndex + 2).trim(),
    name: String(name).trim(),
    organization: String(organization).trim(),
    city: String(city).trim(),
    // NOTE: PRD lists summary as an editorial field within A-F; confirm which col
    // holds it at first real read. Until then col D detail text doubles as summary.
    summary: String(city || organization).trim(),
    imageId: imageId ? String(imageId).trim() : null,
    category: String(category).trim().toLowerCase(),
  };
}

/** slug = kebab(name)+id per PRD routing spec. */
export function slugify(name: string, id: string): string {
  const kebab = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${kebab}-${id}`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
