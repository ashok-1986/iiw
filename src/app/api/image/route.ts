import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/image?id=<driveFileId> — server-side proxy for Drive thumbnails (PRD):
 *  - hides credential/referrer, adds size control (sz=w800), solves CORS
 *  - caches 1 day + immutable
 *  - missing/unfetchable -> lotus fallback (client PortraitArch renders initials
 *    on non-image response; PRD "302 to /fallback-lotus.svg" implemented as direct
 *    SVG 200 for cacheability + logging)
 * The API key is NEVER forwarded to the client and NEVER required for
 * anyone-with-link files.
 */
// cacheComponents mode: no `dynamic` segment config allowed; the request-driven
// `id` lookup below keeps the handler dynamic.

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><circle cx="44" cy="44" r="44" fill="#F6EDE6"/><g fill="#B76E79"><ellipse cx="44" cy="30" rx="6" ry="14"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(45 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(90 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(135 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(180 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(225 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(270 44 44)"/><ellipse cx="44" cy="30" rx="6" ry="14" transform="rotate(315 44 44)"/></g><circle cx="44" cy="44" r="7" fill="#D4AF7A"/></svg>`;

function fallback(): NextResponse {
  return new NextResponse(FALLBACK_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !/^[a-zA-Z0-9_-]{20,}$/.test(id)) {
    // includes MOCKID_* placeholders and malformed input
    if (id) console.warn('[api/image] no portrait for id, serving lotus fallback');
    return fallback();
  }

  try {
    const upstream = await fetch(
      `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
      { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(8000) },
    );
    if (!upstream.ok || !(upstream.headers.get('content-type') ?? '').startsWith('image/')) {
      console.warn('[api/image] upstream', upstream.status, 'for', id);
      return fallback();
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err) {
    console.error('[api/image] error:', (err as Error).message);
    return fallback();
  }
}
