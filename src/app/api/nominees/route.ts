import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getNominees } from '@/lib/sheets';

/**
 * GET /api/nominees — 82 curated profiles, cols A-F only (PII guardrail enforced
 * upstream in lib/sheets.ts range). ETag per PRD; SWR-friendly headers.
 * ISR 3600s semantics: Cache-Control max-age + revalidate; webhook path calls
 * revalidateTag('nominees') via /api/revalidate (M5).
 */
// NOTE: cacheComponents mode (next.config.ts) forbids `dynamic`/`revalidate`
// segment configs; request-driven behavior comes from reading req.headers below.

export async function GET(req: NextRequest) {
  const result = await getNominees();
  const body = JSON.stringify(result);
  const etag = `"${createHash('sha1').update(body).digest('hex')}"`;

  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers: { 'ETag': etag } });
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=300',
    },
  });
}
