import type { MetadataRoute } from 'next';
import { getNominees } from '@/lib/sheets';
import { toFlipProfile } from '@/lib/flipbook-store';
import { SITE_URL } from '@/lib/site';

/**
 * Every published profile is a crawlable deep link (PRD: shareable + indexable).
 * getNominees is 'use cache'-wrapped, so this stays a static route between
 * revalidations rather than hitting Sheets on every crawler request.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { nominees } = await getNominees();
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...nominees.map((n) => ({
      url: `${SITE_URL}/profile/${toFlipProfile(n).slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
