import { ImageResponse } from 'next/og';
import { getNominees } from '@/lib/sheets';
import { toFlipProfile } from '@/lib/flipbook-store';
import { loadOgFonts } from '@/lib/og-fonts';
import { portraitDataUri } from '@/lib/portrait';
import { OgProfileCard } from '@/components/OgCard';

/**
 * Per-profile OpenGraph card (PRD: "OpenGraph portrait cards" for share previews).
 * Data comes from the same cached getNominees() the page renders, so a share card
 * can never show a different roster than the page it represents.
 */
export const alt = 'Portrait of the honoured woman — Inspiring Indian Women archive';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { nominees } = await getNominees();
  const profile = nominees.map(toFlipProfile).find((n) => n.slug === slug);

  const [fonts, portrait] = await Promise.all([
    loadOgFonts(),
    portraitDataUri(profile?.imageId ?? null, profile?.image ?? null),
  ]);

  return new ImageResponse(
    <OgProfileCard
      name={profile?.name ?? 'Inspiring Indian Women'}
      category={profile?.category}
      imageUrl={portrait}
      siteLine="A digital heirloom"
    />,
    { ...size, fonts },
  );
}
