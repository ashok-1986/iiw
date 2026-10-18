import { cacheLife, cacheTag } from 'next/cache';
import type { Nominee, NomineeSource } from './nominee';
import { extractDriveId } from './nominee';
import nomineesData from '@/data/nominees.json';

/**
 * Baked-data reader. The consolidated roster (Form responses 1 + Final Directory + Old,
 * deduped, curated-first) and the portraits are generated offline by tools/refresh-data.mjs
 * and committed to the repo, so the running site never depends on Google being reachable or
 * on Drive share settings. Re-run `npm run refresh` after new submissions, then redeploy.
 */
export const SHEET_ID = '1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg';

export interface NomineesResult {
  nominees: Nominee[];
  source: 'baked';
  counts: { total: number; withPortrait: number; consented: number };
  fetchedAt: string;
}

interface RawNominee {
  id: string;
  name: string;
  org?: string;
  summary?: string;
  fullText?: string;
  imageId?: string | null;
  image?: string | null;
  sources?: string[];
}

/**
 * No clean category column exists, so derive a coarse one from the bio/org text.
 * It powers the search chips only; the published subtitle is the real org line.
 */
const CATEGORY_RULES: Array<[string, string[]]> = [
  ['health', ['mental health', 'wellbeing', 'nurs', 'health', 'therapy', 'cancer', 'care ', 'psycholog', 'hospital']],
  ['education', ['school', 'teach', 'education', 'literacy', 'student', 'learning', 'university', 'training']],
  ['enterprise', ['founder', 'entrepreneur', 'ceo', 'business', 'company', 'director of', 'enterprise', 'startup']],
  ['arts-culture', ['artist', 'music', 'dance', 'writer', 'author', 'theatre', 'artistic', 'design', 'film', 'poet']],
  ['community', ['charity', 'community', 'volunteer', 'foundation', 'ngo', 'association', 'network', 'mentor']],
  ['women-empowerment', ['women', 'girls', 'gender', 'empower']],
];

export function deriveCategory(text: string): string {
  const t = ` ${text.toLowerCase()} `;
  for (const [cat, words] of CATEGORY_RULES) {
    if (words.some((w) => t.includes(w))) return cat;
  }
  return 'community';
}

export async function getNominees(): Promise<NomineesResult> {
  'use cache';
  cacheLife('hours');
  cacheTag('nominees');

  const raw = nomineesData as RawNominee[];
  const nominees: Nominee[] = raw.map((r) => {
    const summary = (r.summary ?? '').trim();
    const full = (r.fullText ?? '').trim();
    return {
      id: r.id,
      name: r.name,
      dueDiligence: '',
      organization: (r.org ?? '').trim(),
      city: '',
      summary,
      fullText: full.length > summary.length ? full : summary,
      imageId: r.imageId ?? null,
      image: r.image ?? null,
      imageUrl: null,
      category: deriveCategory(`${summary} ${r.org ?? ''}`),
      consentGiven: true,
      source: (r.sources && r.sources.includes('final-directory') ? 'final-directory' : 'form-responses') as NomineeSource,
    };
  });

  return {
    nominees,
    source: 'baked',
    counts: {
      total: nominees.length,
      withPortrait: nominees.filter((n) => n.image || n.imageId).length,
      consented: nominees.length,
    },
    fetchedAt: new Date().toISOString(),
  };
}

export { extractDriveId };
