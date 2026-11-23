// Featured work — pinned card stack (modelled on Stokt):
// the stage pins while you scroll; the front card slides down and away, the
// next card (peeking above it) steps forward to full size, and so on until the
// last project, then the page continues. Phones get a plain list.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PEEK = 22;      // px each waiting card shows above the one in front
const SHOWN = 4;      // how many waiting cards are visible as strips
const SHRINK = 0.045; // scale step per waiting card

export function initFeatured({ reduced = false } = {}) {
  const deck = document.querySelector('[data-deck]');
  if (!deck) return;
  const cards = [...deck.querySelectorAll('[data-fw-card]')];
  const section = deck.closest('section');
  const n = cards.length;

  if (!reduced && n > 1) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      deck.classList.add('is-stack');
      // Size the stage so the front card plus the peeking strips fit the viewport.
      const size = () => {
        deck.style.width = '';
        const avail = deck.parentElement.clientWidth;
        const w = Math.min(1200, avail, (innerHeight - 150 - PEEK * SHOWN) * 1.72);
        deck.style.width = `${Math.round(w)}px`;
        deck.style.height = `${Math.round(w / 1.72 + PEEK * SHOWN)}px`;
      };
      size();
      ScrollTrigger.addEventListener('refreshInit', size);
      let target = 0, shown = 0, raf = 0;

      const render = (p) => {
        const drop = deck.clientHeight + 80; // distance a card travels to leave the stage
        cards.forEach((c, i) => {
          const d = i - p; // <0: leaving/left, 0: front, >0: waiting behind
          let y, s, b, o = 1;
          if (d <= -1) { y = drop; s = 1; b = 1; o = 0; }
          else if (d < 0) { const t = -d; y = drop * t * t * (3 - 2 * t); s = 1; b = 1; }
          else {
            const k = Math.min(d, SHOWN + 1);
            y = -PEEK * k; s = 1 - SHRINK * k; b = 1 - 0.07 * k;
            if (d > SHOWN) o = Math.max(0, 1 - (d - SHOWN));
          }
          c.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
          c.style.filter = b < 0.999 ? `brightness(${b.toFixed(3)})` : '';
          c.style.opacity = o;
          c.style.visibility = o === 0 ? 'hidden' : '';
          c.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none';
          c.setAttribute('tabindex', Math.abs(d) < 0.5 ? '0' : '-1');
        });
      };
      const loop = () => {
        shown += (target - shown) * 0.14;
        if (Math.abs(target - shown) < 0.0005) shown = target;
        render(shown);
        raf = shown !== target ? requestAnimationFrame(loop) : 0;
      };
      const st = ScrollTrigger.create({
        trigger: deck,
        start: () => `top ${Math.max(84, (innerHeight - deck.clientHeight) / 2 + 30)}px`,
        end: () => `+=${(n - 1) * innerHeight * 0.85}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => { target = self.progress * (n - 1); if (!raf) raf = requestAnimationFrame(loop); },
        onRefresh: (self) => { target = shown = self.progress * (n - 1); render(shown); },
      });
      render(0);
      return () => {
        st.kill(); cancelAnimationFrame(raf);
        ScrollTrigger.removeEventListener('refreshInit', size);
        deck.style.width = deck.style.height = '';
        deck.classList.remove('is-stack');
        cards.forEach((c) => { c.style.cssText = c.style.cssText.replace(/transform[^;]*;|filter[^;]*;|opacity[^;]*;|visibility[^;]*;|pointer-events[^;]*;/g, ''); c.removeAttribute('tabindex'); });
      };
    });
    mm.add('(max-width: 760px)', () => {
      cards.forEach((c) => gsap.from(c, { opacity: 0, y: 50, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } }));
    });
  }

  // "View case study" pill that follows the cursor over the cards.
  const pill = section.querySelector('[data-fw-cursor]');
  if (!pill || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0, y = 0, cx = 0, cy = 0, raf2 = 0, over = null;
  const tick = () => {
    cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
    pill.style.left = `${cx}px`; pill.style.top = `${cy}px`;
    raf2 = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(tick) : 0;
  };
  const sync = () => {
    const el = document.elementFromPoint(x, y);
    const card = el && el.closest('[data-fw-card]');
    over = card;
    pill.classList.toggle('is-on', !!card);
  };
  section.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; sync(); if (!raf2) raf2 = requestAnimationFrame(tick); });
  section.addEventListener('pointerleave', () => pill.classList.remove('is-on'));
  addEventListener('scroll', () => { if (over !== null || pill.classList.contains('is-on')) sync(); }, { passive: true });
}
