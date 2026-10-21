// tools/crop.mjs
// Shared portrait cropper: face-centred square (UltraFace via face.mjs), smartcrop fallback.
// Used by refresh-data.mjs (Drive portraits) and manual-portraits.mjs (hand-supplied photos).
import fs from 'node:fs';
import sharp from 'sharp';
import smartcrop from 'smartcrop';
import { detectFace } from './face.mjs';

export const PORTRAIT_SIZE = 600;
export const stats = { face: 0, fallback: 0 }; // crop method counts, logged by the caller

// Square, centred on the most salient region (faces dominate it), so circles never cut a face off.
// smartcrop (skin/edge/saturation scoring) picks the window; sharp does the pixel work.
const sharpOps = {
  open: async (img) => { const m = await img.metadata(); return { width: m.width, height: m.height, _s: img }; },
  resample: async (im, w, h) => ({ width: Math.floor(w), height: Math.floor(h), _s: im._s }),
  getData: async (im) => {
    const { data, info } = await im._s.clone().resize(im.width, im.height, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return new smartcrop.ImgData(info.width, info.height, data);
  },
};

/**
 * Crop `rawFile` to a PORTRAIT_SIZE square JPEG at `outFile`.
 * opts (all optional, defaults reproduce the original refresh-data behaviour):
 *   trim       fraction (0-0.45) cut from every side BEFORE detection, e.g. to drop a baked-in frame
 *   maxUpscale never enlarge the crop window beyond this factor: the window is at least
 *              PORTRAIT_SIZE / maxUpscale px, so a tiny face widens the shot instead of blowing it up
 * Returns { method: 'face' | 'smartcrop', window: {x,y,width,height} } in trimmed-image pixels.
 */
export async function cropPortrait(rawFile, outFile, opts = {}) {
  const { trim = 0, maxUpscale = 0 } = opts;
  // Default failOn ('warning'): a truncated download throws here so the caller can re-fetch it.
  let oriented = await sharp(rawFile).rotate().toBuffer();
  if (trim > 0) {
    const m0 = await sharp(oriented).metadata();
    const dx = Math.round(m0.width * trim), dy = Math.round(m0.height * trim);
    oriented = await sharp(oriented).extract({ left: dx, top: dy, width: m0.width - 2 * dx, height: m0.height - 2 * dy }).toBuffer();
  }
  const meta = await sharp(oriented).metadata();
  let c, method;
  if (opts.window) {
    c = opts.window;
    method = 'manual';
  } else {
    const face = await detectFace(oriented);
    if (face) {
      // head-and-shoulders window: face ~40% of the square, a little headroom above it
      const minSide = maxUpscale > 0 ? Math.ceil(PORTRAIT_SIZE / maxUpscale) : 0;
      const want = Math.max(Math.round(Math.max(face.w, face.h) * 2.5), minSide);
      const side = Math.min(want, meta.width, meta.height);
      const cx = face.x + face.w / 2, cy = face.y + face.h / 2;
      c = {
        width: side, height: side,
        x: Math.round(Math.min(Math.max(cx - side / 2, 0), meta.width - side)),
        y: Math.round(Math.min(Math.max(cy - side * 0.45, 0), meta.height - side)),
      };
      stats.face++;
      method = 'face';
    } else {
      ({ topCrop: c } = await smartcrop.crop(sharp(oriented), { width: 100, height: 100, ruleOfThirds: false, imageOperations: sharpOps }));
      stats.fallback++;
      method = 'smartcrop';
    }
  }
  const buf = await sharp(oriented)
    .extract({ left: c.x, top: c.y, width: c.width, height: c.height })
    .resize(PORTRAIT_SIZE, PORTRAIT_SIZE, { fit: 'cover' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(outFile, buf); // direct write: the dev server may hold the old file open (no rename)
  return { method, window: c };
}
