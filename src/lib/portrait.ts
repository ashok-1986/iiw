import fs from 'fs';
import path from 'path';

/**
 * Server-side portrait fetch for ImageResponse (satori) cards.
 *
 * Supports both local files (for manual/community nominees) and Google Drive thumbnails.
 * Inlining as a data URI avoids satori SSRF blocking on localhost/preview origins.
 */
export async function portraitDataUri(
  imageId: string | null = null,
  imagePath: string | null = null,
): Promise<string | null> {
  // 1. Try local file in public/ if available (instant, zero network latency)
  if (imagePath) {
    try {
      const clean = imagePath.replace(/^\//, '');
      const localFile = path.join(process.cwd(), 'public', clean);
      if (fs.existsSync(localFile)) {
        const buf = fs.readFileSync(localFile);
        const ext = path.extname(localFile).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    } catch {
      /* fallback to imageId or null */
    }
  }

  // 2. Fetch Drive thumbnail if imageId is provided
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
