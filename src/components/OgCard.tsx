import { getInitials } from '@/lib/nominee';

/**
 * OG card JSX for ImageResponse (satori).
 *
 * Colours are literal hexes copied from the tokens in app/globals.css — satori does
 * not evaluate CSS custom properties, so this is the one place the palette is
 * duplicated. Keep in sync with :root when a token changes.
 * Layout is flex-only with explicit sizes: no grid, no shorthand borders.
 */
const PLUM = '#0e2b25'; // --ground
const ROSE = '#c2185b'; // --magenta
const BLUSH = '#5fc4a8'; // --menthe (emerald on ground)
const GOLD = '#d4af37'; // --gold
const CREAM = '#fff8ec'; // --surface-2
const LIFT = '#15382f'; // ground, one step lighter
const PAPER = '#fbf1dc'; // --surface

export function OgProfileCard({
  name,
  category,
  imageUrl,
  siteLine,
}: {
  name: string;
  category?: string;
  imageUrl: string | null;
  siteLine: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: PLUM,
        backgroundImage: `linear-gradient(115deg, ${PLUM} 0%, ${LIFT} 55%, ${PLUM} 100%)`,
        padding: 70,
        alignItems: 'center',
        gap: 64,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 292,
          height: 292,
          borderRadius: 146,
          border: `10px solid ${CREAM}`,
          outline: `3px solid ${ROSE}`,
          background: PAPER,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- satori has no next/image
          <img src={imageUrl} alt={name} width={272} height={272} style={{ borderRadius: 136 }} />
        ) : (
          <div style={{ display: 'flex', fontSize: 96, color: ROSE, fontFamily: 'Display' }}>
            {getInitials(name)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 18 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'UI',
            fontSize: 22,
            letterSpacing: 6,
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
            fontSize: 66,
            lineHeight: 1.08,
            color: CREAM,
          }}
        >
          {name}
        </div>

        {category ? (
          <div
            style={{
              display: 'flex',
              fontFamily: 'UI',
              fontSize: 24,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: BLUSH,
            }}
          >
            {category}
          </div>
        ) : null}

        <div style={{ display: 'flex', height: 1, width: 220, background: GOLD }} />

        <div
          style={{
            display: 'flex',
            fontFamily: 'Accent',
            fontStyle: 'italic',
            fontSize: 30,
            color: ROSE,
          }}
        >
          {siteLine}
        </div>
      </div>
    </div>
  );
}
