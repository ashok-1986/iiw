// tools/face.mjs
// Face detection for portrait cropping (UltraFace RFB-320, 1.2 MB ONNX, MIT).
// onnxruntime-node lives in tools/package.json (not the site's) so Vercel never installs it.
// If it is missing, detectFace() returns undefined and the caller falls back to smartcrop.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL = path.join(__dirname, 'models', 'version-RFB-320.onnx');
const W = 320, H = 240; // model input

let session; // undefined = not tried, null = unavailable
let ort;

async function load() {
  if (session !== undefined) return session;
  try {
    ort = createRequire(import.meta.url)('onnxruntime-node');
    ort.env.logSeverityLevel = 3; // errors only: the model export is noisy about initializers
    session = await ort.InferenceSession.create(MODEL, { logSeverityLevel: 3 });
  } catch {
    session = null;
  }
  return session;
}

const iou = (a, b) => {
  const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1), x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area = (r) => (r.x2 - r.x1) * (r.y2 - r.y1);
  return inter / (area(a) + area(b) - inter || 1);
};

/** Largest confident face in the image buffer, in source pixels, or null. undefined = detector unavailable. */
export async function detectFace(buffer, threshold = 0.7) {
  const s = await load();
  if (!s) return undefined;
  const meta = await sharp(buffer).metadata();
  const { data } = await sharp(buffer).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const input = new Float32Array(3 * W * H);
  for (let i = 0; i < W * H; i++) for (let c = 0; c < 3; c++) input[c * W * H + i] = (data[i * 3 + c] - 127) / 128;
  const out = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, H, W]) });
  const scores = out.scores.data, boxes = out.boxes.data, n = out.scores.dims[1];
  const cands = [];
  for (let i = 0; i < n; i++) {
    const sc = scores[i * 2 + 1];
    if (sc < threshold) continue;
    cands.push({ sc, x1: boxes[i * 4] * meta.width, y1: boxes[i * 4 + 1] * meta.height, x2: boxes[i * 4 + 2] * meta.width, y2: boxes[i * 4 + 3] * meta.height });
  }
  cands.sort((a, b) => b.sc - a.sc);
  const kept = [];
  for (const c of cands) if (kept.every((k) => iou(k, c) < 0.3)) kept.push(c);
  if (!kept.length) return null;
  // group photos: take the biggest face, not the most confident one
  const f = kept.sort((a, b) => (b.x2 - b.x1) * (b.y2 - b.y1) - (a.x2 - a.x1) * (a.y2 - a.y1))[0];
  return { x: f.x1, y: f.y1, w: f.x2 - f.x1, h: f.y2 - f.y1 };
}
