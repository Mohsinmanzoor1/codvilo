// Interactive "pixel field" for the hero: a grid of small squares (echoing the two
// squares in the Codvilo logo) that grow, light up and get pushed around by the
// pointer. Clicking or tapping sends a ripple across the grid. When nobody is
// interacting, a soft point wanders on its own so the field never looks dead.

const FG = [242, 239, 232];
const A1 = [107, 92, 255]; // #6B5CFF
const A2 = [57, 55, 151]; // #393797

export function initField(canvas, { reduced = false, gap: baseGap = 22, home = [0.72, 0.42] } = {}) {
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  let w = 0, h = 0, dpr = 1, gap = 26, cols = 0, rows = 0, cells = [];
  let raf = 0, visible = true, t0 = performance.now();

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, last: -1e9, power: 0 };
  const ripples = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gap = w < 760 ? Math.max(16, baseGap - 4) : baseGap;
    cols = Math.ceil(w / gap) + 1;
    rows = Math.ceil(h / gap) + 1;
    const ox = (w - (cols - 1) * gap) / 2;
    const oy = (h - (rows - 1) * gap) / 2;
    cells = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        cells.push({ x: ox + i * gap, y: oy + j * gap, alt: (i + j) % 2, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 1.4, v: 0 });
      }
    }
    if (!pointer.active) { pointer.x = pointer.tx = w * home[0]; pointer.y = pointer.ty = h * home[1]; }
    if (reduced) draw(performance.now());
  }

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function ripple(x, y, strength = 1) {
    ripples.push({ x, y, born: performance.now(), strength });
    if (ripples.length > 6) ripples.shift();
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    const idle = now - pointer.last > 2600;

    // Wander on a slow Lissajous path when idle; otherwise follow the pointer.
    if (idle) {
      pointer.tx = w * (home[0] + 0.22 * Math.sin(t * 0.37));
      pointer.ty = h * (home[1] + 0.22 * Math.sin(t * 0.53 + 1.2));
    }
    pointer.x += (pointer.tx - pointer.x) * 0.12;
    pointer.y += (pointer.ty - pointer.y) * 0.12;
    pointer.power += ((idle ? 0.55 : 1) - pointer.power) * 0.05;

    const R = Math.max(200, Math.min(w, h) * 0.4);
    const live = ripples.filter((r) => now - r.born < 1800);
    ripples.length = 0; ripples.push(...live);

    ctx.clearRect(0, 0, w, h);
    for (const c of cells) {
      const dx = c.x - pointer.x, dy = c.y - pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      let f = Math.max(0, 1 - d / R);
      f = Math.pow(f, 1.6) * pointer.power;

      let push = f * 20;
      let nx = dx / d, ny = dy / d;
      for (const r of live) {
        const age = (now - r.born) / 1000;
        const rdx = c.x - r.x, rdy = c.y - r.y;
        const rd = Math.hypot(rdx, rdy) || 1;
        const ring = Math.max(0, 1 - Math.abs(rd - age * 820) / 90) * (1 - age / 1.8) * r.strength;
        if (ring > 0) {
          f = Math.max(f, ring * 0.95);
          push += ring * 16;
          nx = rdx / rd; ny = rdy / rd;
        }
      }

      // Ease each cell's energy so it lingers a little after the pointer passes.
      c.v += (f - c.v) * (f > c.v ? 0.35 : 0.06);
      const e = c.v;
      const tw = 0.5 + 0.5 * Math.sin(t * c.speed + c.phase);
      const size = 1.4 + e * gap * 0.5 + tw * 0.5;
      const alpha = 0.11 + tw * 0.06 + e * 0.89;
      const target = c.alt ? A2 : A1;
      const k = Math.min(1, e * 1.6);
      const r = FG[0] + (target[0] - FG[0]) * k;
      const g = FG[1] + (target[1] - FG[1]) * k;
      const b = FG[2] + (target[2] - FG[2]) * k;
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
      const px = c.x + nx * push - size / 2;
      const py = c.y + ny * push - size / 2;
      ctx.fillRect(px, py, size, size);
    }
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && !reduced) raf = requestAnimationFrame(loop); };

  new ResizeObserver(resize).observe(canvas);
  resize();

  if (!reduced) {
    host.addEventListener('pointermove', (e) => {
      const [x, y] = local(e);
      pointer.tx = x; pointer.ty = y; pointer.active = true; pointer.last = performance.now();
    }, { passive: true });
    host.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      const [x, y] = local(e);
      pointer.tx = x; pointer.ty = y; pointer.last = performance.now();
      ripple(x, y);
    }, { passive: true });
    host.addEventListener('pointerleave', () => { pointer.last = -1e9; });

    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }).observe(host);
    document.addEventListener('visibilitychange', start);
    start();
  }

  return { ripple: (fx = 0.72, fy = 0.42, s = 1) => ripple(w * fx, h * fy, s) };
}
