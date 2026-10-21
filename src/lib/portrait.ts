import fs from 'fs';
import path from 'path';

const SUPPORTED_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

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
      const clean = imagePath.replace(/^\/+/, '');
      const publicDir = path.resolve(process.cwd(), 'public');
      const candidatePath = path.resolve(publicDir, clean);

      // Prevent directory traversal attacks outside of public directory
      if (candidatePath.startsWith(publicDir + path.sep) && fs.existsSync(candidatePath)) {
        // Prevent symlink escapes by resolving real paths
        const realFile = fs.realpathSync(candidatePath);
        const realPublic = fs.realpathSync(publicDir);

        if (realFile.startsWith(realPublic + path.sep)) {
          const ext = path.extname(realFile).toLowerCase();
          const mime = SUPPORTED_MIME[ext];

          // Return data only for explicitly supported extensions; skip unsupported formats (e.g. GIF)
          // so execution can fall through to Drive fallback rather than mislabeling as JPEG.
          if (mime) {
            const buf = fs.readFileSync(realFile);
            return `data:${mime};base64,${buf.toString('base64')}`;
          }
        }
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
