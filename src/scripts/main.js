import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initField } from './field.js';
import { initHero3D } from './hero3d.js';
import { initBento } from './bento.js';
import { initAbout } from './about.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

/* ---------- Interactive dot fields ---------- */
const hero3d = initHero3D($('[data-hero3d]'), { reduced });
const ctaField = initField($('[data-field-cta]'), { reduced, gap: 22, home: [0.5, 0.5] });

/* ---------- Smooth scroll ---------- */
let lenis;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Mobile menu ---------- */
const nav = $('[data-nav]');
const burger = $('[data-burger]');
const menu = $('[data-menu]');
const setMenu = (open) => {
  menu.classList.toggle('is-open', open);
  nav.classList.toggle('menu-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  open ? lenis?.stop() : lenis?.start();
};
burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

/* ---------- Nav: hide on scroll down, adapt to light sections ---------- */
ScrollTrigger.create({
  start: 240,
  end: 'max',
  onUpdate: (self) => !menu.classList.contains('is-open') && nav.classList.toggle('is-hidden', self.direction === 1),
  onLeaveBack: () => nav.classList.remove('is-hidden'),
});
$$('[data-theme="light"]').forEach((sec) => {
  ScrollTrigger.create({ trigger: sec, start: 'top 36px', end: 'bottom 36px', toggleClass: { targets: nav, className: 'is-light' } });
});

/* ---------- Services bento ---------- */
initBento({ reduced });
initAbout({ reduced });

/* ---------- Process cards: reveal, typing brief, grow dial ---------- */
{
  const pcards = $$('[data-pcard]');
  const pio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const i = pcards.indexOf(e.target);
    setTimeout(() => e.target.classList.add('is-in'), reduced ? 0 : i * 140);
    pio.unobserve(e.target);
  }), { threshold: 0.25 });
  pcards.forEach((c) => pio.observe(c));

  // Discover: type the brief, pause, repeat while on screen.
  const t = $('.pa1-text');
  if (t && !reduced) {
    const full = t.dataset.type;
    let vis = false;
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(t);
    (async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (;;) {
        while (!vis) await wait(400);
        for (let k = 0; k <= full.length; k++) { t.textContent = full.slice(0, k); await wait(38); }
        await wait(3200);
        for (let k = full.length; k >= 0; k -= 2) { t.textContent = full.slice(0, k); await wait(14); }
        await wait(400);
      }
    })();
  }

  // Grow: active segment steps around; hovering a segment selects it.
  const dial = $('[data-dial]');
  if (dial) {
    const segs = $$('[data-seg]', dial);
    const icons = $$('[data-icon]', dial);
    let k = 1;
    let hover = false;
    const setSeg = (n) => {
      k = n;
      segs.forEach((s, i) => s.classList.toggle('on', i === n));
      icons.forEach((s, i) => s.classList.toggle('on', i === n));
    };
    segs.forEach((s, i) => {
      s.addEventListener('pointerenter', () => { hover = true; setSeg(i); });
      s.addEventListener('pointerleave', () => { hover = false; });
    });
    if (!reduced) setInterval(() => { if (!hover && !document.hidden) setSeg((k + 1) % segs.length); }, 1800);
  }

  // Hovering a card pushes its progress bar to full.
  pcards.forEach((c) => {
    const bar = $('.pcard__bar i', c);
    c.addEventListener('pointerenter', () => { bar.style.width = '100%'; });
    c.addEventListener('pointerleave', () => { bar.style.width = ''; });
  });
}


/* ---------- Word split (keeps two-tone spans) ---------- */
function split(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.append(' ');
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.append(s); }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    });
  };
  walk(el);
  return $$('.w', el);
}


/* ---------- Testimonials slider (native scroll + snap, buttons, drag) ---------- */
{
  const track = $('[data-testi-track]');
  const cards = $$('[data-tcard]', track);
  const prev = $('[data-testi-prev]');
  const next = $('[data-testi-next]');
  const bar = $('[data-testi-bar]');
  const step = () => cards[0].getBoundingClientRect().width + 14;
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 1;
    const view = track.clientWidth / track.scrollWidth;
    bar.style.transform = `translateX(${p * (1 / view - 1) * 100}%) scaleX(${view})`;
    bar.style.transformOrigin = 'left';
    bar.style.width = '100%';
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  };
  bar.style.transition = 'none';
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  // Click-and-drag on desktop
  let down = false, startX = 0, startLeft = 0, moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
    track.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false; track.classList.remove('is-dragging');
    if (moved) {
      const i = Math.round(track.scrollLeft / step());
      track.scrollTo({ left: i * step(), behavior: 'smooth' });
    }
  });
}

if (reduced) {
  $$('[data-fade]').forEach((el) => (el.style.opacity = 1));
} else {
  const wordsFrom = { opacity: 0, yPercent: 40, filter: 'blur(10px)' };
  const wordsTo = { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: EASE, stagger: 0.035 };

  /* Hero intro */
  const heroTitle = $('.hero__title');
  const heroWords = split(heroTitle);
  const heroFades = $$('[data-fade]', $('.hero'));
  gsap.set(heroWords, wordsFrom);
  gsap.set(heroFades, { opacity: 0, y: 16 });
  gsap.timeline({ delay: 0.15 })
    .from(nav, { y: -24, opacity: 0, duration: 1, ease: EASE })
    .from('[data-hero3d]', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
    .add(() => hero3d.intro(), 0)
    .to(heroFades[0], { opacity: 1, y: 0, duration: 0.9, ease: EASE }, 0.1)
    .to(heroWords, wordsTo, 0.2)
    .to(heroFades.slice(1), { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.08 }, 0.7);

  /* Scroll reveals */
  $$('[data-split]').forEach((el) => {
    if (el === heroTitle) return;
    const words = split(el);
    gsap.fromTo(words, wordsFrom, { ...wordsTo, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-fade]').forEach((el) => {
    if (heroFades.includes(el)) return;
    gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.from('[data-card]', { opacity: 0, y: 40, duration: 1, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: '.process__grid', start: 'top 85%' } });
  gsap.from('.pcard__bar i', { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: '.process__grid', start: 'top 80%' } });
  gsap.from('[data-pcase]', { opacity: 0, y: 48, duration: 1.1, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: '.wlist__grid', start: 'top 85%' } });
  gsap.from('[data-tcard]', { opacity: 0, x: 60, duration: 1.1, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: '[data-testi-track]', start: 'top 85%' } });
  gsap.from('.band__ic', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(1.6)', stagger: { each: 0.03, from: 'center' }, scrollTrigger: { trigger: '.band', start: 'top 85%' } });
  if (false) gsap.from('.logo', { opacity: 0, y: 24, duration: 0.9, ease: EASE, stagger: { each: 0.03, grid: 'auto', from: 'start' }, scrollTrigger: { trigger: '[data-logos]', start: 'top 85%' } });
  ScrollTrigger.create({ trigger: '.cta', start: 'top 70%', once: true, onEnter: () => ctaField.ripple(0.5, 0.5, 1.2) });

  /* Subtle parallax on hero content */
  gsap.to('.hero__inner', { yPercent: -12, opacity: 0.4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: (self) => hero3d.setScroll(self.progress) });

  /* Magnetic buttons */
  if (finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25);
        y((e.clientY - r.top - r.height / 2) * 0.25);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
