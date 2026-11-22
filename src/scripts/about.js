// About section: reveals, counters, card spotlight + tilt, section cursor and a draggable globe.
export function initAbout({ reduced = false } = {}) {
  const sec = document.querySelector('[data-about]');
  if (!sec) return;
  const cards = [...sec.querySelectorAll('[data-ab]')];

  // Staggered reveal + count-up.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = cards.indexOf(e.target);
      setTimeout(() => e.target.classList.add('is-in'), reduced ? 0 : (i % 4) * 90);
      e.target.querySelectorAll('[data-count]').forEach((el) => countUp(el, Number(el.dataset.count), reduced));
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  cards.forEach((c) => io.observe(c));

  // Spotlight + gentle 3D tilt.
  cards.forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', `${x}px`); c.style.setProperty('--my', `${y}px`);
      if (!reduced && c.hasAttribute('data-tilt')) {
        c.style.transform = `perspective(900px) rotateX(${(0.5 - y / r.height) * 5}deg) rotateY(${(x / r.width - 0.5) * 6}deg)`;
      }
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });

  // Section cursor (white dot; violet label bubble over interactive cards).
  const cur = sec.querySelector('[data-ab-cursor]');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (cur && fine && !reduced) {
    const label = cur.querySelector('span');
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; cur.style.transform = `translate(${cx}px, ${cy}px)`; raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(tick) : 0; };
    sec.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY; cur.classList.add('is-on');
      const t = e.target.closest('[data-cursor]');
      label.textContent = t ? t.dataset.cursor : '';
      cur.classList.toggle('is-label', !!t);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    sec.addEventListener('pointerleave', () => cur.classList.remove('is-on', 'is-label'));
  }

  // Globe (loaded only when it's about to be seen).
  const cv = sec.querySelector('[data-globe]');
  if (cv) {
    const gio = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      gio.disconnect();
      const [{ geoOrthographic, geoPath, geoGraticule10 }, { feature }, land] = await Promise.all([
        import('d3-geo'), import('topojson-client'), import('world-atlas/land-110m.json'),
      ]);
      startGlobe(cv, { geoOrthographic, geoPath, geoGraticule10, land: feature(land.default || land, (land.default || land).objects.land), reduced });
    }, { rootMargin: '200px' });
    gio.observe(cv);
  }
}

function countUp(el, to, reduced) {
  if (reduced || to < 2) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1400;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function startGlobe(cv, { geoOrthographic, geoPath, geoGraticule10, land, reduced }) {
  const ctx = cv.getContext('2d');
  const HOME = [74.3587, 31.5204]; // Lahore
  const proj = geoOrthographic().clipAngle(90).precision(0.4);
  const path = geoPath(proj, ctx);
  const grat = geoGraticule10();
  let rot = [-HOME[0] + 40, -18, 0], vel = 0.06, drag = null, visible = true, size = 0, t = 0;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    size = cv.clientWidth;
    cv.width = cv.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    proj.scale(size / 2 - 2).translate([size / 2, size / 2]);
  };
  new ResizeObserver(resize).observe(cv);
  resize();

  const draw = () => {
    t += 1;
    proj.rotate(rot);
    ctx.clearRect(0, 0, size, size);
    // sphere glow
    const g = ctx.createRadialGradient(size * 0.42, size * 0.35, size * 0.05, size / 2, size / 2, size / 2);
    g.addColorStop(0, '#161523'); g.addColorStop(1, '#09090b');
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(169,156,255,0.35)'; ctx.stroke();
    // graticule
    ctx.beginPath(); path(grat); ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.stroke();
    // land outlines
    ctx.beginPath(); path(land); ctx.fillStyle = 'rgba(107,92,255,0.07)'; ctx.fill();
    ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(243,242,238,0.75)'; ctx.stroke();
    // home marker (visible hemisphere only)
    const p = proj(HOME);
    const visibleHome = Math.cos(((HOME[0] + rot[0]) * Math.PI) / 180) * Math.cos(((HOME[1] + rot[1]) * Math.PI) / 180) > 0;
    if (p && visibleHome) {
      const pulse = (t % 90) / 90;
      ctx.beginPath(); ctx.arc(p[0], p[1], 4 + pulse * 16, 0, Math.PI * 2); ctx.strokeStyle = `rgba(169,156,255,${1 - pulse})`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, Math.PI * 2); ctx.fillStyle = '#6b5cff'; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    }
  };

  const loop = () => {
    if (!visible || document.hidden) { requestAnimationFrame(loop); return; }
    if (!drag && !reduced) rot[0] += vel;
    draw();
    if (!reduced) requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, r: [...rot] }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    rot[0] = drag.r[0] + (e.clientX - drag.x) * 0.35;
    rot[1] = Math.max(-60, Math.min(60, drag.r[1] - (e.clientY - drag.y) * 0.35));
    if (reduced) draw();
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  draw();
  if (!reduced) requestAnimationFrame(loop);
}
