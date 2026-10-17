import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const runtimeSpecifier = process.env.QODER_GLTF_RUNTIME
  ? pathToFileURL(path.resolve(process.env.QODER_GLTF_RUNTIME)).href
  : '@phodal/modeling-glb';
const { createModelBundle, modelCreate } = await import(runtimeSpecifier);

// Replace only defineModel(). Keep the delivery block below intact.
// Define the primary mass, semantic root, expected bounds, and budgets before
// adding bounded groups of detail. The scaffold fails closed until authored so
// a sample object's geometry can never leak into the requested model.
const source = defineModel();

// Lotus medallion for the IIW flipbook cover — three interleaved petal rings
// (Menthe / Nectarine / Pêche) over a cream base plate with a Lagune rim and
// Pêche centre pod. Appearance keys keep their legacy names (blush / rose / gold).
// Units are meters in the create frame (+Y up); the medallion lies flat in XZ
// so the viewer can tip it toward the camera. Petals are flat ellipsoids set
// along +Z and rotated about X to lift their tips, then repeated with radial
// patterns so the ring symmetry is design intent, not scattered transforms.
function defineModel() {
  return modelCreate('lotus medallion accent for the IIW flipbook cover')
    .appearance('lotus.cream', { baseColor: '#FBF0E6', metallic: 0.02, roughness: 0.72 })
    .appearance('lotus.blush', { baseColor: '#96C7B3', metallic: 0.05, roughness: 0.55 }) // Menthe
    .appearance('lotus.rose', { baseColor: '#D7897F', metallic: 0.08, roughness: 0.48 }) // Nectarine
    .appearance('lotus.gold', { baseColor: '#F9B95C', metallic: 0.82, roughness: 0.28 }) // Pêche
    .appearance('lotus.lagune', { baseColor: '#6398A9', metallic: 0.45, roughness: 0.35 }) // Lagune

    // Semantic root
    .occurrence('lotus.medallion', { name: 'LotusMedallion' })

    // Base plate + rim
    .part('lotus.plate', {
      name: 'LotusPlate',
      parent: 'lotus.medallion',
      appearance: 'lotus.cream',
      geometry: { type: 'primitive.cylinder', radius: 0.42, height: 0.03, radialSegments: 48, axis: 'y' },
      translation: [0, -0.015, 0],
    })
    .part('lotus.rim', {
      name: 'LotusRim',
      parent: 'lotus.medallion',
      appearance: 'lotus.lagune',
      geometry: { type: 'primitive.hollow-cylinder', outerRadius: 0.46, innerRadius: 0.415, height: 0.05, radialSegments: 48, axis: 'y' },
      translation: [0, 0.005, 0],
    })

    // Ring 1 — twelve blush petals, lowest and most open
    .part('lotus.petalOuter', {
      name: 'LotusPetalOuter',
      parent: 'lotus.medallion',
      appearance: 'lotus.blush',
      geometry: { type: 'primitive.ellipsoid', radii: [0.078, 0.022, 0.185], widthSegments: 20, heightSegments: 10 },
      translation: [0, 0.035, 0.275],
      rotationRad: [-0.30, 0, 0],
    })
    .pattern('lotus.ringOuter', { type: 'radial', source: 'lotus.petalOuter', count: 12, axis: 'y' })

    // Ring 2 — eight rose petals, drawn in and lifted
    .part('lotus.petalMid', {
      name: 'LotusPetalMid',
      parent: 'lotus.medallion',
      appearance: 'lotus.rose',
      geometry: { type: 'primitive.ellipsoid', radii: [0.062, 0.020, 0.140], widthSegments: 20, heightSegments: 10 },
      translation: [0, 0.055, 0.170],
      rotationRad: [-0.58, 0, 0],
    })
    .pattern('lotus.ringMid', { type: 'radial', source: 'lotus.petalMid', count: 8, axis: 'y' })

    // Ring 3 — six gold petals, closest to the pod
    .part('lotus.petalInner', {
      name: 'LotusPetalInner',
      parent: 'lotus.medallion',
      appearance: 'lotus.gold',
      geometry: { type: 'primitive.ellipsoid', radii: [0.044, 0.016, 0.092], widthSegments: 16, heightSegments: 8 },
      translation: [0, 0.070, 0.095],
      rotationRad: [-0.88, 0, 0],
    })
    .pattern('lotus.ringInner', { type: 'radial', source: 'lotus.petalInner', count: 6, axis: 'y' })

    // Centre — seed crown + pod
    .part('lotus.crown', {
      name: 'LotusCrown',
      parent: 'lotus.medallion',
      appearance: 'lotus.rose',
      geometry: { type: 'primitive.hollow-cylinder', outerRadius: 0.072, innerRadius: 0.050, height: 0.032, radialSegments: 24, axis: 'y' },
      translation: [0, 0.055, 0],
    })
    .part('lotus.pod', {
      name: 'LotusPod',
      parent: 'lotus.medallion',
      appearance: 'lotus.gold',
      geometry: { type: 'primitive.sphere', radius: 0.056, widthSegments: 20, heightSegments: 12 },
      translation: [0, 0.068, 0],
    })

    .expectBounds({
      min: [-0.46, -0.03, -0.46],
      max: [0.46, 0.141, 0.46],
      tolerance: 0.02,
    })
    .budget({
      maxOperations: 40,
      maxGeneratedInstances: 40,
      maxNodes: 80,
      maxVertices: 14000,
      maxTriangles: 16000,
      maxBytes: 1_500_000,
    });
}

const bundle = await createModelBundle(source.program());
await Promise.all([
  writeAtomic('program.gltf.json', JSON.stringify(bundle.program, null, 2) + '\n'),
  writeAtomic('artifact.glb', bundle.artifact),
  writeAtomic('artifact.gltf-project.json', bundle.projectSidecar),
  writeAtomic('capability-report.json', JSON.stringify(bundle.capabilityReport, null, 2) + '\n'),
]);

process.stdout.write(JSON.stringify({
  status: 'committed',
  revision: bundle.inspection.revision,
  bounds: bundle.inspection.bounds,
  counts: bundle.validation.counts,
}) + '\n');

async function writeAtomic(filePath, data) {
  const absolute = path.resolve(filePath);
  const temporary = path.join(path.dirname(absolute), '.' + path.basename(absolute) + '.' + process.pid + '.tmp');
  await writeFile(temporary, data);
  await rename(temporary, absolute);
}
