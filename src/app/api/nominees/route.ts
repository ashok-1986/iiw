import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getNominees } from '@/lib/sheets';
import { slugify, type Nominee } from '@/lib/nominee';

/**
 * GET /api/nominees — public profile payload.
 *
 * PII GUARDRAIL: the wire shape is an explicit allowlist. The internal Nominee model
 * carries curator-only fields (`dueDiligence` = vetting notes, "please fill in the bio")
 * and raw sheet provenance; those MUST NOT reach the client. Never spread a Nominee
 * directly into this response — add fields here deliberately.
 * See DATA-RECONCILIATION.md §1 (email column exists in adjacent tabs and is never parsed).
 */
interface PublicNominee {
  id: string;
  name: string;
  summary: string;
  imageId: string | null;
  category: string;
  slug: string;
}

function toPublic(n: Nominee): PublicNominee {
  return {
    id: n.id,
    name: n.name,
    summary: n.summary,
    imageId: n.imageId,
    category: n.category,
    slug: slugify(n.name, n.id),
  };
}

export async function GET(req: NextRequest) {
  const result = await getNominees();
  const payload = {
    nominees: result.nominees.map(toPublic),
    counts: { total: result.nominees.length, withPortrait: result.nominees.filter((n) => n.imageId).length },
    updatedAt: result.fetchedAt,
  };
  const body = JSON.stringify(payload);
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

