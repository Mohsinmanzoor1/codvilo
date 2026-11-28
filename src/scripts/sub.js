import './deal.js';
// Script for inner pages (work listing and case studies).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';

let lenis;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* Menu */
const nav = $('[data-nav]');
const burger = $('[data-burger]');
const menu = $('[data-menu]');
const setMenu = (open) => {
  menu.classList.toggle('is-open', open);
  nav.classList.toggle('menu-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  burger.setAttribute('aria-expanded', String(open));
  open ? lenis?.stop() : lenis?.start();
};
burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

/* Nav */
ScrollTrigger.create({
  start: 240, end: 'max',
  onUpdate: (self) => !menu.classList.contains('is-open') && nav.classList.toggle('is-hidden', self.direction === 1),
  onLeaveBack: () => nav.classList.remove('is-hidden'),
});
$$('[data-theme="light"]').forEach((sec) => {
  ScrollTrigger.create({ trigger: sec, start: 'top 40px', end: 'bottom 40px', toggleClass: { targets: nav, className: 'is-light' } });
});

/* Filters on the work page */
const grid = $('[data-grid]');
if (grid) {
  const cards = $$('[data-pcase]', grid);
  $$('[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('[data-filter]').forEach((b) => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    const show = cards.filter((c) => f === 'All' || c.dataset.cat === f);
    const hide = cards.filter((c) => !show.includes(c));
    grid.classList.toggle('is-filtered', f !== 'All');
    gsap.to(hide, { opacity: 0, y: 16, duration: 0.25, onComplete: () => hide.forEach((c) => (c.hidden = true)) });
    gsap.delayedCall(0.26, () => {
      show.forEach((c) => (c.hidden = false));
      gsap.fromTo(show, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.06 });
      ScrollTrigger.refresh();
    });
  }));
}

/* Word split + reveals */
function split(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((p) => {
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

if (reduced) {
  $$('[data-fade]').forEach((el) => (el.style.opacity = 1));
} else {
  gsap.from(nav, { y: -24, opacity: 0, duration: 1, ease: EASE });
  $$('[data-split]').forEach((el, i) => {
    const words = split(el);
    const first = i === 0;
    gsap.fromTo(words, { opacity: 0, yPercent: 40, filter: 'blur(10px)' }, {
      opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: EASE, stagger: 0.035, delay: first ? 0.15 : 0,
      scrollTrigger: first ? undefined : { trigger: el, start: 'top 85%' },
    });
  });
  $$('[data-fade]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  gsap.from('[data-pcase]', { opacity: 0, y: 48, duration: 1.1, ease: EASE, stagger: 0.08, delay: 0.3 });

  /* Case study: cover reveal + parallax, steps, stats, gallery */
  const cover = $('[data-cover]');
  if (cover) {
    gsap.fromTo(cover, { clipPath: 'inset(12% 6% 0% 6% round 24px)', y: 40 }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', y: 0, duration: 1.6, ease: 'expo.inOut', delay: 0.4 });
    gsap.to($('img', cover), { yPercent: -8, ease: 'none', scrollTrigger: { trigger: cover, start: 'top 60%', end: 'bottom top', scrub: true } });
  }
  if ($$('[data-step]').length) gsap.from('[data-step]', { opacity: 0, x: -20, duration: 0.8, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: '.csteps', start: 'top 85%' } });
  $$('[data-count]').forEach((el) => {
    const m = el.dataset.count.match(/^(\d+)(.*)$/);
    if (!m) return;
    const target = Number(m[1]); const suffix = m[2]; const o = { v: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => (el.textContent = `${Math.round(o.v)}${suffix}`) });
  });
  $$('[data-gal]').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 60, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  addEventListener('load', () => ScrollTrigger.refresh());
}
