import { cacheLife, cacheTag } from 'next/cache';
import type { Nominee, SheetTable } from './nominee';
import { mapSheetRow, extractDriveId } from './nominee';
import { MOCK_NOMINEES } from './mock-data';

/**
 * Real-data reader for the IIW sheet.
 *
 * Auth: the sheet is shared publicly, so we use the gviz/CSV export (no key, no quota,
 * no API enablement needed). The supplied API key has the Sheets API BLOCKED
 * (API_KEY_SERVICE_BLOCKED) — confirmed in DATA-RECONCILIATION.md §4 — so this path
 * is the working one, not a shortcut.
 *
 * Merge policy (curated-first):
 *   1. Final Directory (gid 0)            — curated rows, boolean consent
 *   2. Flipbook (gid 293174)              — form rows, free-text consent, has Image Upload
 *   3. Drive Folder 2 (recursive)         — 90 portraits in one subfolder, fuzzy name match
 * Rows are deduped by normalised name; curated data wins, form data fills portraits/description.
 * Sensitive columns (email) are never parsed — see nominee.ts header binding.
 */
export const SHEET_ID = '1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg';
export const GID_FINAL_DIRECTORY = '0';
export const GID_FLIPBOOK = '293174';
export const FOLDER_2_ID = '18R9269jJWgs2yAWha9hdUjRZKb2e-TO8OqbqgJYojS6y54k-oodFg-iapCx7AV-v5W5rsgHx';

export interface NomineesResult {
  nominees: Nominee[];
  source: 'sheets+drive' | 'sheets' | 'last-good-cache' | 'mock';
  counts: { finalDirectory: number; formResponses: number; merged: number; driveImages: number; consented: number };
  fetchedAt: string;
}

const TIMEOUT_MS = 15_000;

/** Minimal CSV parser (quote-aware, handles CRLF and doubled quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '', row: string[] = [], quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function readTab(gid: string): Promise<SheetTable | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`gviz ${res.status}`);
    const rows = parseCsv(await res.text());
    if (rows.length < 2) return null;
    return { headers: rows[0], rows: rows.slice(1) };
  } catch (err) {
    console.error(`[sheets] tab ${gid} failed:`, (err as Error).message);
    return null;
  }
}

/** Recursively list image files under a Drive folder (Folder 2 nests inside a subfolder). */
export async function listDriveImages(folderId: string, key = process.env.GOOGLE_DRIVE_API_KEY): Promise<Map<string, string>> {
  const out = new Map<string, string>(); // normalised name -> file id
  if (!key) return out;
  const stack = [folderId];
  try {
    while (stack.length) {
      const parent = stack.pop() as string;
      const q = encodeURIComponent(`'${parent}' in parents and trashed=false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${encodeURIComponent('files(id,name,mimeType)')}&pageSize=1000&key=${key}`;
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) { console.warn('[drive] list', res.status); continue; }
      const json = (await res.json()) as { files?: Array<{ id: string; name: string; mimeType: string }> };
      for (const f of json.files ?? []) {
        if (f.mimeType === 'application/vnd.google-apps.folder') stack.push(f.id);
        // Guardrail: Folder 1 contains a Google Form object; only real images qualify.
        else if (f.mimeType.startsWith('image/')) {
          const stem = f.name.replace(/\.[^.]+$/, '').trim().toLowerCase();
          if (!out.has(stem)) out.set(stem, f.id);
        }
      }
    }
  } catch (err) {
    console.error('[drive] traversal failed:', (err as Error).message);
  }
  return out;
}

const normName = (s: string) => s.toLowerCase().replace(/\(([^)]*)\)/g, ' $1 ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Curator-name -> Drive portrait id, exact then token-subset fuzzy. */
function matchPortrait(name: string, drive: Map<string, string>): string | null {
  const n = normName(name);
  for (const [stem, id] of drive) if (normName(stem) === n) return id;
  const nameTokens = n.split(' ').filter((t) => t.length > 2);
  let best: { id: string; score: number } | null = null;
  for (const [stem, id] of drive) {
    const s = normName(stem);
    const score = nameTokens.filter((t) => s.includes(t)).length / Math.max(nameTokens.length, 1);
    if (score >= 0.6 && (!best || score > best.score)) best = { id, score };
  }
  return best?.id ?? null;
}

/**
 * Public data entry point.
 * `use cache` + cacheLife('hours') is the Next 16 cacheComponents equivalent of the
 * PRD's ISR revalidate:3600; cacheTag('nominees') is what /api/revalidate will purge
 * (M5 webhook). Uncached scopes reading this must wrap it in <Suspense>.
 */
export async function getNominees(): Promise<NomineesResult> {
  'use cache';
  cacheLife('hours');
  cacheTag('nominees');

  const [fd, fb, drive] = await Promise.all([
    readTab(GID_FINAL_DIRECTORY),
    readTab(GID_FLIPBOOK),
    listDriveImages(FOLDER_2_ID),
  ]);

  if (!fd && !fb) {
    console.warn('[nominees] no sheet access — serving labeled MOCK data');
    return {
      nominees: MOCK_NOMINEES.map((m) => ({ ...m, dueDiligence: '', organization: '', city: '', imageUrl: null, consentGiven: false })),
      source: 'mock',
      counts: { finalDirectory: 0, formResponses: 0, merged: MOCK_NOMINEES.length, driveImages: 0, consented: 0 },
      fetchedAt: new Date().toISOString(),
    };
  }

  const merged = new Map<string, Nominee>();

  const ingest = (table: SheetTable | null, source: Nominee['source']) => {
    if (!table) return 0;
    let n = 0;
    table.rows.forEach((row, i) => {
      const nm = mapSheetRow(table, row, source, i);
      if (!nm) return;
      n++;
      const key = normName(nm.name);
      const prev = merged.get(key);
      if (!prev) { merged.set(key, nm); return; }
      // curated-first, then fill any field the earlier row lacked
      const keep = prev.source === 'final-directory' || source === 'final-directory' ? prev : nm;
      const fill = nm;
      merged.set(key, {
        ...keep,
        summary: keep.summary || fill.summary,
        imageId: keep.imageId ?? matchPortrait(keep.name, drive) ?? fill.imageId,
        imageUrl: keep.imageUrl ?? fill.imageUrl,
        dueDiligence: keep.dueDiligence || fill.dueDiligence,
        consentGiven: keep.consentGiven || fill.consentGiven,
      });
    });
    return n;
  };

  const finalDirectoryCount = ingest(fd, 'final-directory');
  const formResponsesCount = ingest(fb, 'form-responses');

  // Curated rows have no image column at all — resolve portraits from the Drive listing.
  for (const nm of merged.values()) {
    if (!nm.imageId) nm.imageId = matchPortrait(nm.name, drive);
  }

  const nominees = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    nominees,
    source: drive.size ? 'sheets+drive' : 'sheets',
    counts: {
      finalDirectory: finalDirectoryCount,
      formResponses: formResponsesCount,
      merged: nominees.length,
      driveImages: drive.size,
      consented: nominees.filter((n) => n.consentGiven).length,
    },
    fetchedAt: new Date().toISOString(),
  };
}

export { extractDriveId };
