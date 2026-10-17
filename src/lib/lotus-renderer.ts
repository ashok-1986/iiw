/**
 * lotus-renderer — mounts the generated lotus-medallion.glb into a container.
 *
 * Imported dynamically (never statically) so three.js stays out of the first
 * bundle and the cover's LCP element is unaffected. The medallion is authored
 * flat in XZ with +Y up, so the camera sits above the paper and looks down at
 * roughly 48°, which keeps the mandala readable while giving it real depth.
 *
 * The gold petals are metallic PBR, so they need an environment to reflect —
 * a RoomEnvironment through PMREM is what stops them rendering as flat black.
 */
const MODEL_SRC = '/models/lotus-medallion.glb';

// Type-only: the namespace exists for annotations, while the runtime module is
// pulled in dynamically so it never lands in the shared bundle.
import type * as THREE from 'three';

export async function mountLotusMedallion(
  host: HTMLElement,
  onReady?: () => void,
): Promise<() => void> {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');

  const width = host.clientWidth || 180;
  const height = host.clientHeight || width;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'low-power',
  });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // RoomEnvironment is a bright white room; without damping it blows the blush
  // petals out to paper, so the env contribution and exposure stay under 1.
  renderer.toneMappingExposure = 0.92;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
  // Steep three-quarter view: flat enough to read the mandala's radial symmetry,
  // tilted enough that the lifted petal tips still carry depth.
  camera.position.set(0, 2.0, 1.28);
  camera.lookAt(0, 0.02, 0);
  scene.environmentIntensity = 0.55;

  const key = new THREE.DirectionalLight(0xfff2dd, 1.15);
  key.position.set(1.4, 3.2, 1.8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf9b95c, 0.5);
  rim.position.set(-1.8, 0.9, -1.4);
  scene.add(rim);

  // tilt group carries pointer parallax; the loaded model spins inside it.
  const tilt = new THREE.Group();
  scene.add(tilt);

  const model = await new GLTFLoader().loadAsync(MODEL_SRC);
  const lotus = model.scene;
  lotus.rotation.x = -0.06; // tips of the outer ring lean a touch toward camera
  tilt.add(lotus);
  onReady?.();

  let visible = true;
  let active = true;
  let raf = 0;

  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  const onPointerMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  const onPointerLeave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(host);

  const resize = new ResizeObserver(() => {
    const w = host.clientWidth || width;
    const h = host.clientHeight || width;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resize.observe(host);

  // THREE.Clock is deprecated in this three version; a plain timestamp delta
  // gives the same clamped dt without the console warning.
  let last = performance.now();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!active || !visible || document.hidden) return;
    // Damped follow rather than direct binding: the medallion keeps momentum.
    eased.x += (pointer.x - eased.x) * Math.min(1, dt * 4.5);
    eased.y += (pointer.y - eased.y) * Math.min(1, dt * 4.5);
    tilt.rotation.z = eased.x * 0.16;
    tilt.rotation.x = 0.05 + eased.y * 0.13;
    lotus.rotation.y += dt * 0.16;
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    active = false;
    cancelAnimationFrame(raf);
    observer.disconnect();
    resize.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
    lotus.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
