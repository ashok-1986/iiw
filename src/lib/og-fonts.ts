/**
 * TTF subsets for ImageResponse (satori). next/font's WOFF2 variables do not work
 * here — satori needs raw TTF/OTF bytes, so the OG cards load their own copies.
 * Fontsource over jsDelivr is used because it serves stable TTF URLs; if the CDN
 * is unreachable the caller falls back to ImageResponse's built-in default font
 * rather than failing the whole image route.
 */
const FONT_CDN = 'https://cdn.jsdelivr.net/fontsource/fonts';

const SOURCES = {
  display: `${FONT_CDN}/playfair-display@latest/latin-700-normal.ttf`,
  accent: `${FONT_CDN}/cormorant-garamond@latest/latin-500-italic.ttf`,
  ui: `${FONT_CDN}/inter@latest/latin-500-normal.ttf`,
} as const;

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  /** satori accepts fixed weights only — see SatoriOptions['fonts']. */
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: 'normal' | 'italic';
}

async function get(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** Load whichever families are reachable; empty array = use the default font. */
export async function loadOgFonts(): Promise<OgFont[]> {
  const [display, accent, ui] = await Promise.all([
    get(SOURCES.display),
    get(SOURCES.accent),
    get(SOURCES.ui),
  ]);

  const fonts: OgFont[] = [];
  if (display) fonts.push({ name: 'Display', data: display, weight: 700, style: 'normal' });
  if (accent) fonts.push({ name: 'Accent', data: accent, weight: 500, style: 'italic' });
  if (ui) fonts.push({ name: 'UI', data: ui, weight: 500, style: 'normal' });
  return fonts;
}
