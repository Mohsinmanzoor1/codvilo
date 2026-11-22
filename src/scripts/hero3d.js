// Hero 3D scene: the two squares from the Codvilo logo, rebuilt as two equal
// brushed-metal blocks that meet corner to corner (top-left #6B5CFF,
// bottom-right #393797). They float as one mark, gently "breathe" apart along
// their diagonal and click back together, tilt toward the pointer, and turn as
// the page scrolls. Rendering pauses whenever the hero is off-screen.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, CanvasTexture,
  RepeatWrapping, PMREMGenerator, DirectionalLight, PointLight, Color, SRGBColorSpace,
  ACESFilmicToneMapping, MathUtils, Vector2,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function brushedTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    const v = 90 + Math.random() * 90;
    g.strokeStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.22})`;
    g.lineWidth = Math.random() * 1.4 + 0.2;
    g.beginPath();
    const x = Math.random() * 512;
    g.moveTo(x - 300, y);
    g.lineTo(x + 300, y + (Math.random() - 0.5) * 1.5);
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(1.3, 1.3);
  return t;
}

const SIZE = 2.7; // both blocks share one size, like the logo's two squares
const DEPTH = 1.05;

export function initHero3D(canvas, { reduced = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.closest('.hero')?.classList.add('no-webgl');
    return { intro() {}, setScroll() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const brushed = brushedTexture();
  const makeMat = (hex) => new MeshPhysicalMaterial({
    color: new Color(hex), metalness: 1, roughness: 0.34, roughnessMap: brushed,
    bumpMap: brushed, bumpScale: 0.6, anisotropy: 0.85,
    clearcoat: 0.25, clearcoatRoughness: 0.3, iridescence: 0.06, iridescenceIOR: 1.3,
  });

  const geo = new RoundedBoxGeometry(SIZE, SIZE, DEPTH, 10, 0.2);
  const a = new Mesh(geo, makeMat('#7a63ff')); // top-left square  (#6B5CFF)
  const b = new Mesh(geo, makeMat('#3f3cc4')); // bottom-right square (#393797)

  // The mark: B sits exactly one block right and one block down from A.
  const mark = new Group();
  mark.add(a, b);
  const tiltGroup = new Group();
  tiltGroup.add(mark);
  const group = new Group();
  group.add(tiltGroup);
  scene.add(group);
  const BASE_ROT = [-0.38, 0.52, -0.06];

  const key = new DirectionalLight('#efeaff', 1.5); key.position.set(-6, 7, 8); scene.add(key);
  const fill = new PointLight('#7b5cff', 180, 30, 1.6); fill.position.set(4, -2, -3); scene.add(fill);
  const rim = new PointLight('#b9a8ff', 90, 30, 1.8); rim.position.set(-3, -5, 4); scene.add(rim);
  const top = new PointLight('#5d6bff', 60, 30, 1.8); top.position.set(5, 6, 3); scene.add(top);

  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const vw = vh * camera.aspect;
    if (camera.aspect > 1.1) {
      group.position.set(vw * 0.24, -vh * 0.01, 0);
      group.scale.setScalar(Math.min(1, vw / 13));
    } else {
      group.position.set(vw * 0.2, -vh * 0.33, 0);
      group.scale.setScalar(Math.min(0.62, vw / 10));
    }
  };
  new ResizeObserver(layout).observe(canvas);
  layout();

  const pointer = new Vector2();
  const tilt = new Vector2();
  let introT = reduced ? 1 : 0, introStart = -1, scroll = 0, scrollSmooth = 0;
  let visible = true, raf = 0;
  const clock = performance.now();

  if (!reduced) {
    addEventListener('pointermove', (e) => {
      pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    }, { passive: true });
  }

  const easeOut = (x) => 1 - Math.pow(1 - x, 4);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function frame(now) {
    const t = (now - clock) / 1000;
    if (introStart >= 0 && introT < 1) introT = Math.min(1, (now - introStart) / 2400);
    const k = easeOut(introT);
    tilt.lerp(pointer, 0.05);
    scrollSmooth += (scroll - scrollSmooth) * 0.08;
    const motion = reduced ? 0 : 1;

    // "Breathe": every ~6s the blocks part along the diagonal and settle back.
    const cycle = (t % 6) / 6;
    const breathe = motion * (cycle < 0.5 ? easeInOut(cycle * 2) : easeInOut(2 - cycle * 2)) * 0.14;
    // Intro: blocks start apart and click into place.
    const gap = -0.26 + breathe + (1 - k) * 1.6 + scrollSmooth * 0.9;
    const half = SIZE / 2 + gap / 2;
    a.position.set(-half, half, 0);
    b.position.set(half, -half, 0);
    a.rotation.set(0, 0, (1 - k) * -0.5 + scrollSmooth * -0.25);
    b.rotation.set(0, 0, (1 - k) * 0.5 + scrollSmooth * 0.25);

    // Whole mark: float, slow sway, pointer tilt, scroll turn.
    mark.position.y = Math.sin(t * 0.7) * 0.18 * motion - (1 - k) * 2.5 + scrollSmooth * 1.2;
    mark.rotation.set(
      BASE_ROT[0] + Math.sin(t * 0.4) * 0.05 * motion + scrollSmooth * 0.45 - (1 - k) * 0.6,
      BASE_ROT[1] + Math.cos(t * 0.33) * 0.07 * motion + scrollSmooth * 0.5,
      BASE_ROT[2],
    );
    tiltGroup.rotation.set(tilt.y * 0.16, tilt.x * 0.26, 0);
    const s = 0.7 + 0.3 * k;
    mark.scale.setScalar(s);

    key.position.x = -6 + tilt.x * 4;
    key.position.y = 7 - tilt.y * 3;
    renderer.render(scene, camera);
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    frame(now);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

  if (reduced) {
    frame(performance.now());
    new ResizeObserver(() => frame(performance.now())).observe(canvas);
  } else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);
    start();
  }

  return {
    intro() { if (!reduced) introStart = performance.now(); },
    setScroll(p) { scroll = p; },
  };
}
