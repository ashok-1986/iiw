import { NextResponse } from 'next/server';
import { getNominees } from '@/lib/sheets';
import { toFlipProfile } from '@/lib/flipbook-store';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';


export async function GET() {
  const { nominees } = await getNominees();
  const profiles = nominees.map(toFlipProfile);

  const sections: string[] = [
    `# ${SITE_NAME} — Complete Profile Archive (2026 Edition)`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## Metadata',
    `- Publisher: ${SITE_NAME}`,
    `- Total Honourees: ${profiles.length}`,
    `- Published URL: ${SITE_URL}/`,
    `- About & Curation Policy: ${SITE_URL}/about`,
    '',
    '---',
    '',
  ];

  for (const p of profiles) {
    sections.push(
      `## ${p.name}`,
      `- Canonical URL: ${SITE_URL}/profile/${p.slug}`,
      p.org ? `- Organisation / Affiliation: ${p.org}` : '',
      p.category ? `- Category: ${p.category}` : '',
      `- Curation Status: ${p.compiled ? 'Compiled by IIW from public records' : 'Published in nominee’s own consented words'}`,
      '',
      `### Executive Summary`,
      p.summary,
      '',
      `### Full Biography`,
      p.fullText,
      '',
      '---',
      '',
    );
  }

  // Filter out empty lines caused by optional fields
  const body = sections.filter((s) => s !== '').join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
