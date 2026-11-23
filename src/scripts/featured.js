// Featured work: the cards start stacked as a deck (later cards peek out above
// the first one, each a little narrower) and unfold into a list as you scroll.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initFeatured({ reduced = false } = {}) {
  const deck = document.querySelector('[data-deck]');
  if (!deck) return;
  const cards = [...deck.querySelectorAll('[data-fw-card]')];
  const section = deck.closest('section');

  if (!reduced && cards.length > 1) {
    const PEEK = 22; // px each card shows above the one in front
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      // Offset of card i so that it sits behind card 0, peeking out above it.
      const SHOWN = Math.min(cards.length - 1, 5);
      // The stack starts lower than the list so the peeking cards stay clear of the heading.
      const LIFT = PEEK * SHOWN + 24;
      const yFor = (i) => () => cards[0].offsetTop - cards[i].offsetTop - PEEK * Math.min(i, SHOWN) + LIFT;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: deck, start: 'top 82%', end: () => `+=${Math.min(cards[cards.length - 1].offsetTop, window.innerHeight * 1.6)}`, scrub: 0.9, invalidateOnRefresh: true },
      });
      cards.forEach((c, i) => {
        if (i === 0) return;
        tl.fromTo(c,
          { y: yFor(i), scale: () => 1 - Math.min(i, 5) * 0.055, filter: `brightness(${1 - Math.min(i, 5) * 0.08})` },
          { y: 0, scale: 1, filter: 'brightness(1)', ease: 'power2.inOut', duration: 1 },
          (i - 1) * 0.16);
      });
      // First card lifts slightly as the deck opens.
      tl.fromTo(cards[0], { y: LIFT }, { y: 0, ease: 'power2.inOut', duration: 1 }, 0);
      return () => gsap.set(cards, { clearProps: 'transform,filter' });
    });
    mm.add('(max-width: 760px)', () => {
      cards.forEach((c) => gsap.from(c, { opacity: 0, y: 50, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } }));
    });
  }

  // "View case study" pill that follows the cursor over the cards.
  const pill = section.querySelector('[data-fw-cursor]');
  if (!pill || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  const tick = () => {
    cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
    pill.style.left = `${cx}px`; pill.style.top = `${cy}px`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(tick) : 0;
  };
  cards.forEach((c) => {
    c.addEventListener('pointerenter', (e) => { cx = x = e.clientX; cy = y = e.clientY; tick(); pill.classList.add('is-on'); });
    c.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(tick); });
    c.addEventListener('pointerleave', () => pill.classList.remove('is-on'));
  });
  addEventListener('scroll', () => pill.classList.contains('is-on') && !document.querySelector('[data-fw-card]:hover') && pill.classList.remove('is-on'), { passive: true });
}
