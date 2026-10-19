import { ImageResponse } from 'next/og';
import { getNominees } from '@/lib/sheets';
import { loadOgFonts } from '@/lib/og-fonts';
import { SITE_DESCRIPTION } from '@/lib/site';

/** Site-level OpenGraph card: deep-lagoon ground, pêche rule, archive headline. */
// Literals copied from the tokens in globals.css (satori cannot read CSS variables).
const PLUM = '#0e2b25'; // --ground
const ROSE = '#c2185b'; // --magenta
const GOLD = '#d4af37'; // --gold
const CREAM = '#fff8ec'; // --surface-2
const BLUSH = '#5fc4a8'; // --menthe
const LIFT = '#15382f'; // ground, one step lighter

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
          backgroundImage: `linear-gradient(135deg, ${PLUM} 0%, ${LIFT} 50%, ${PLUM} 100%)`,
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
