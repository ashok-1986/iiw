// tools/manual-portraits.mjs
// Offline patch for the 5 nominees with hand-supplied photos in design-src/portraits-raw/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { cropPortrait } from './crop.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORTRAITS = path.join(ROOT, 'public', 'portraits');
const RAW = path.join(ROOT, 'design-src', 'portraits-raw');
const NOMINEES_FILE = path.join(ROOT, 'src', 'data', 'nominees.json');

const MANUAL_SPECS = [
  {
    name: 'Hema Yellapragada',
    slug: 'hema-yellapragada',
    rawFile: 'Hema Yellapragada.jpg',
    opts: { maxUpscale: 1.2 },
  },
  {
    name: 'Usha Raghavan',
    slug: 'usha-raghavan',
    rawFile: 'Usha Raghavan.jpg',
    opts: { trim: 0.06 },
  },
  {
    name: 'Suparna Rathi',
    slug: 'suparna-rathi',
    rawFile: 'Suparna Rathi.jpeg',
    opts: {},
  },
  {
    name: 'Hema Manjunath',
    slug: 'hema-manjunath',
    rawFile: 'Hema Manjunath.jpg',
    opts: {},
  },
  {
    name: 'Kirti Soni',
    slug: 'kirti-soni',
    rawFile: 'Kirti Soni.jpg',
    opts: {},
  },
  {
    name: 'Sonoo Malkani',
    slug: 'sonoo-malkani',
    rawFile: 'Sonoo Malkani.jpeg',
    opts: {},
  },
  {
    name: 'Dalia Banerjee',
    slug: 'dalia-banerjee',
    rawFile: 'Dalia Banerjee.jpg',
    opts: {},
  },
  {
    name: 'Sunita Chaubey',
    slug: 'sunita-chaubey',
    rawFile: 'Sunita Chaubey.jpg',
    opts: {},
  },
  {
    name: 'Zamiha Desai MBE',
    slug: 'zamiha-desai',
    rawFile: 'Zamiha Desai.jpg',
    opts: {},
  },
  {
    name: 'Ranu Mehta-Radia MBE',
    slug: 'ranu-mehta-radia',
    rawFile: 'Ranu Mehta-Radia.jpg',
    opts: {},
  },
  {
    name: 'Renu Gidoomal',
    slug: 'renu-gidoomal',
    rawFile: 'Renu Gidoomal.jpg',
    opts: { trim: 0.185 },
    assertCornersNotWhite: true,
  },
  {
    name: 'Ragasudha Vinjamuri',
    slug: 'ragasudha-vinjamuri',
    rawFile: 'Ragasudha Vinjamuri.jpg',
    opts: {},
  },
  {
    name: 'Seema Anand',
    slug: 'seema-anand',
    rawFile: 'Seema Anand.jpg',
    opts: {},
  },
  // Name as the Sheet spells it; the raw file is "Kavita Gulati.jpeg". Photo of a screen: black band at the bottom and right edge.
  {
    name: 'Kaveeta Gulati',
    slug: 'kaveeta-gulati',
    rawFile: 'Kavita Gulati.jpeg',
    opts: { trim: 0.06 },
  },
  {
    name: 'Paromita Goswani',
    slug: 'paromita-goswani',
    rawFile: 'Paromita Goswani.jpeg',
    opts: {},
  },
  // Selfie with a pale margin along the top-left and right edges.
  {
    name: 'Reena Bagga',
    slug: 'reena-bagga',
    rawFile: 'Reena Bagga.jpeg',
    opts: { trim: 0.03 },
  },
  {
    name: 'Lakshmi Kaul',
    slug: 'lakshmi-kaul',
    rawFile: 'Lakshmi Kaul.jpg',
    opts: {
      window: { x: 247, y: 195, width: 610, height: 610 },
    },
  },
];

const HON = new Set(['dr','prof','professor','mr','mrs','ms','mx','smt','shri','sri','capt','col','maj','cllr','councillor','rev','revd','amb','er','adv','sir','dame']);
const POST = new Set(['obe','mbe','bem','cbe','frsa','mba','phd','jp','fca','aca','msc','bsc','ba','ma']);

function nameTokens(s) {
  return String(s)
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !HON.has(t) && !POST.has(t));
}

function normName(s) {
  return nameTokens(s).join(' ');
}

export async function applyManualPortraits(nominees) {
  fs.mkdirSync(PORTRAITS, { recursive: true });

  for (const spec of MANUAL_SPECS) {
    const normTarget = normName(spec.name);
    const matches = nominees.filter((n) => normName(n.name) === normTarget);

    if (matches.length !== 1) {
      throw new Error(`Expected exactly one record matching "${spec.name}" (norm: "${normTarget}"), found ${matches.length}`);
    }

    const nominee = matches[0];
    const srcPath = path.join(RAW, spec.rawFile);
    const outPath = path.join(PORTRAITS, `manual-${spec.slug}.jpg`);

    if (!fs.existsSync(srcPath)) {
      throw new Error(`Raw portrait file not found: ${srcPath}`);
    }

    await cropPortrait(srcPath, outPath, spec.opts);
    if (spec.assertCornersNotWhite) {
      const { data, info } = await sharp(outPath).raw().toBuffer({ resolveWithObject: true });
      const corners = [
        [0, 0],
        [info.width - 1, 0],
        [0, info.height - 1],
        [info.width - 1, info.height - 1],
      ];
      for (const [cx, cy] of corners) {
        const idx = (cy * info.width + cx) * info.channels;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (r > 245 && g > 245 && b > 245) {
          throw new Error(`Corner pixel (${cx},${cy}) in ${outPath} is near-white: [${r},${g},${b}]`);
        }
      }
    }
    nominee.image = `/portraits/manual-${spec.slug}.jpg`;
  }

  return nominees;
}

// Standalone execution: node tools/manual-portraits.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const nominees = JSON.parse(fs.readFileSync(NOMINEES_FILE, 'utf8'));
  await applyManualPortraits(nominees);
  fs.writeFileSync(NOMINEES_FILE, JSON.stringify(nominees, null, 1));
  console.log(`Successfully applied manual portraits for ${MANUAL_SPECS.length} nominees in ${NOMINEES_FILE}`);
}
