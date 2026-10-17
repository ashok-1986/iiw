import { promises as fs } from 'fs';
import path from 'path';
import type { Nominee, RawRow } from './nominee';
import { mapRow } from './nominee';
import { MOCK_NOMINEES } from './mock-data';

/** PRD appendix — single source of truth for the 82 profiles. */
export const SHEET_ID = '1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg';
const TAB = 'Final Directory';
const RANGE = `${TAB}!A2:F`; // cols A-F ONLY, header excluded (PRD guardrail)

export interface NomineesResult {
  nominees: Nominee[];
  source: 'sheets' | 'last-good-cache' | 'mock';
  fetchedAt: string;
}

const CACHE_FILE = path.join(process.cwd(), '.cache', 'nominees.json');

/**
 * Read Final Directory!A2:F. Fallback chain per PRD error handling:
 * Sheets API -> last good JSON on disk -> labeled mock data (dev only).
 * Never throws: the site must serve stale rather than 500.
 */
export async function getNominees(): Promise<NomineesResult> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (apiKey) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`sheets ${res.status}`);
      const json = (await res.json()) as { values?: RawRow[] };
      const rows = json.values ?? [];
      if (rows.length === 0) throw new Error('sheets: empty values');
      const nominees = rows.map(mapRow);
      await writeCache({ nominees, source: 'sheets', fetchedAt: new Date().toISOString() });
      return { nominees, source: 'sheets', fetchedAt: new Date().toISOString() };
    } catch (err) {
      console.error('[sheets] fetch failed, trying last-good cache:', (err as Error).message);
      const cached = await readCache();
      if (cached) return { ...cached, source: 'last-good-cache' };
    }
  }
  // No key (or cache miss): serve clearly-labeled mock so M1/M2 proceed.
  return { nominees: MOCK_NOMINEES, source: 'mock', fetchedAt: new Date().toISOString() };
}

async function writeCache(result: NomineesResult): Promise<void> {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(result), 'utf8');
  } catch (err) {
    console.error('[sheets] cache write failed:', (err as Error).message);
  }
}

async function readCache(): Promise<NomineesResult | null> {
  try {
    return JSON.parse(await fs.readFile(CACHE_FILE, 'utf8')) as NomineesResult;
  } catch {
    return null;
  }
}
