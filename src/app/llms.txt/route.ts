import { NextResponse } from 'next/server';
import { getNominees } from '@/lib/sheets';
import { toFlipProfile } from '@/lib/flipbook-store';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';


export async function GET() {
  const { nominees } = await getNominees();
  const profiles = nominees.map(toFlipProfile);

  const categories = [...new Set(profiles.map((p) => p.category).filter(Boolean))].sort();

  const lines: string[] = [
    `# ${SITE_NAME} — Top Impactful British Indian Women 2026`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## Overview',
    `- Organization: ${SITE_NAME} (IIW UK)`,
    `- Edition: 2026 (Celebrating 10 years of IIW)`,
    `- Total Honourees: ${profiles.length}`,
    `- Archive Website: ${SITE_URL}/`,
    `- Methodology & Consent: ${SITE_URL}/about`,
    `- Full Corpus for LLMs: ${SITE_URL}/llms-full.txt`,
    '',
    '## Causes & Domains',
    ...categories.map((c) => `- ${c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' & ')}`),
    '',
    '## Nominee Directory',
    ...profiles.map(
      (p) => `- [${p.name}](${SITE_URL}/profile/${p.slug}): ${p.org ? `${p.org} — ` : ''}${p.summary}`,
    ),
    '',
    '## Curation & Provenance Note',
    'Profiles are published in the nominee’s own words, with her consent. A few honoured leaders are compiled by IIW from public records and marked as such.',
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
