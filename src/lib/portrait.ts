/**
 * Server-side portrait fetch for ImageResponse (satori) cards.
 *
 * Why not just point <img> at /api/image/<id>: satori applies SSRF protection and
 * refuses any source that resolves to a private/loopback address, which includes
 * the preview and localhost origins — the whole OG route dies with
 * "Image source resolves to a blocked address". Fetching the Drive thumbnail
 * ourselves and inlining a data URI keeps the card working on every origin,
 * at the cost of one server-side request per generated image.
 */
export async function portraitDataUri(imageId: string | null): Promise<string | null> {
  if (!imageId || !/^[a-zA-Z0-9_-]{20,}$/.test(imageId)) return null;

  try {
    const res = await fetch(`https://drive.google.com/thumbnail?id=${imageId}&sz=w400`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('image/')) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null; // card falls back to the initials medallion
  }
}
