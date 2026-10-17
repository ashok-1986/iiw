import { ImageResponse } from 'next/og';
import { getNominees } from '@/lib/sheets';
import { loadOgFonts } from '@/lib/og-fonts';
import { SITE_DESCRIPTION } from '@/lib/site';

/** Site-level OpenGraph card: plum ground, lotus-gold rule, archive headline. */
const PLUM = '#2d1b2d';
const ROSE = '#c65a74';
const GOLD = '#d9a646';
const CREAM = '#fffdfb';
const BLUSH = '#f0b7c1';

export const alt = 'Inspiring Indian Women — a digital heirloom flipbook';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const { nominees } = await getNominees();
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: PLUM,
          backgroundImage: `linear-gradient(135deg, ${PLUM} 0%, #3a2439 50%, ${PLUM} 100%)`,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
          padding: 80,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'UI',
            fontSize: 24,
            letterSpacing: 8,
            color: GOLD,
            textTransform: 'uppercase',
          }}
        >
          Inspiring Indian Women
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Display',
            fontSize: 92,
            lineHeight: 1.05,
            color: CREAM,
          }}
        >
          A Digital Heirloom
        </div>

        <div style={{ display: 'flex', height: 1, width: 260, background: GOLD }} />

        <div
          style={{
            display: 'flex',
            fontFamily: 'Accent',
            fontStyle: 'italic',
            fontSize: 34,
            color: ROSE,
          }}
        >
          {nominees.length} women · community, enterprise, social impact
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'UI',
            fontSize: 22,
            color: BLUSH,
            maxWidth: 820,
            lineHeight: 1.5,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
