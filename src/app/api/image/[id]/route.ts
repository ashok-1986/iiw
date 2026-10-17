import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/image/[id] — server-side proxy for Drive portraits (PRD).
 * Path-param (not ?id=) form: Next 16 blocks local <Image> srcs with query strings
 * unless whitelisted via images.localPatterns, and a path route is cleaner + cache-keyed.
 *
 *  - hides credential/referrer, controls size (sz=w800), solves CORS
 *  - caches 1 day + immutable
 *  - missing/unfetchable -> lotus SVG (client PortraitArch layers initials on top)
 * The API key is never forwarded to the client and is not required for
 * anyone-with-link files.
 */

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><circle cx="44" cy="44" r="44" fill="#F6EDE6"/><g fill="#B76E79"><ellipse cx="44" cy="30" rx="6" ry="14"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(45 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(90 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(135 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(180 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(225 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(270 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(315 44 44)"/></g><circle cx="44" cy="44" r="7" fill="#D4AF7A"/></svg>`;

function fallback(): NextResponse {
  return new NextResponse(FALLBACK_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(id)) {
    if (id) console.warn('[api/image] invalid/mock portrait id, lotus fallback');
    return fallback();
  }

  try {
    const upstream = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w800`, {
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    const type = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !type.startsWith('image/')) {
      console.warn('[api/image] upstream', upstream.status, type || '(no ctype)', 'for', id);
      return fallback();
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err) {
    console.error('[api/image] error:', (err as Error).message);
    return fallback();
  }
}
