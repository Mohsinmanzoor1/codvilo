// Micro-interactions for the services bento grid.
export function initBento({ reduced = false } = {}) {
  const grid = document.querySelector('[data-bento]');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-bx]')];
  const visible = new WeakMap();

  // Reveal on scroll (staggered) + track visibility so loops only run on screen.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      visible.set(e.target, e.isIntersecting);
      if (e.isIntersecting && !e.target.classList.contains('is-in')) {
        const i = cards.indexOf(e.target);
        setTimeout(() => e.target.classList.add('is-in'), reduced ? 0 : (i % 3) * 110);
      }
    });
  }, { threshold: 0.2 });
  cards.forEach((c) => io.observe(c));
  const on = (el) => visible.get(el) && !document.hidden;

  // Pointer spotlight on every card.
  cards.forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
  if (reduced) { cards.forEach((c) => c.classList.add('is-in')); }

  // Social: cycle notifications.
  const notes = grid.querySelector('[data-notes]');
  if (notes && !reduced) {
    const items = [...notes.children];
    let k = 0;
    setInterval(() => {
      if (!on(notes.closest('[data-bx]'))) return;
      const cur = items[k]; k = (k + 1) % items.length; const nxt = items[k];
      cur.classList.remove('is-on'); cur.classList.add('is-out');
      nxt.classList.remove('is-out'); nxt.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 700);
    }, 3200);
  }

  // Ads: nodes drift with the pointer (parallax).
  const ads = grid.querySelector('[data-ads]');
  if (ads && !reduced) {
    ads.addEventListener('pointermove', (e) => {
      const r = ads.getBoundingClientRect();
      ads.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5) * 14);
      ads.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5) * 14);
      ads.querySelectorAll('.bx-node, .bx-roas').forEach((n) => { n.style.setProperty('--px', ads.style.getPropertyValue('--px')); n.style.setProperty('--py', ads.style.getPropertyValue('--py')); });
    });
    ads.addEventListener('pointerleave', () => ads.querySelectorAll('.bx-node, .bx-roas').forEach((n) => { n.style.setProperty('--px', 0); n.style.setProperty('--py', 0); }));
  }

  // SEO: type the query, then reveal the #1 result; loop.
  const seo = grid.querySelector('[data-seo]');
  if (seo) {
    const q = seo.querySelector('[data-q]');
    const res = seo.querySelector('[data-result]');
    const full = q.textContent;
    if (reduced) { res.classList.add('is-on'); }
    else {
      const run = async () => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        for (;;) {
          while (!on(seo)) await wait(400);
          res.classList.remove('is-on');
          q.textContent = '';
          await wait(500);
          for (let i = 1; i <= full.length; i++) { q.textContent = full.slice(0, i); await wait(55 + Math.random() * 60); }
          await wait(350);
          res.classList.add('is-on');
          await wait(4200);
        }
      };
      run();
    }
  }

  // Ecommerce: pick a size, aim, press "Add to cart", show the paid order; loop.
  const ecom = grid.querySelector('[data-ecom]');
  if (ecom && !reduced) {
    const sizes = [...ecom.querySelectorAll('[data-sizes] i')];
    const add = ecom.querySelector('[data-add]');
    const order = ecom.querySelector('[data-order]');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      let s = 1;
      for (;;) {
        while (!on(ecom)) await wait(400);
        order.classList.remove('is-on');
        await wait(700);
        s = (s + 1) % sizes.length;
        sizes.forEach((el, i) => el.classList.toggle('on', i === s));
        await wait(600);
        add.classList.add('is-aim');
        await wait(800);
        add.classList.add('is-press');
        await wait(220);
        add.classList.remove('is-press');
        await wait(250);
        order.classList.add('is-on');
        add.classList.remove('is-aim');
        await wait(3400);
      }
    })();
  } else if (ecom) { ecom.querySelector('[data-order]').classList.add('is-on'); }

  // Studio: pixel grid lights up near the pointer, plus a gentle idle shimmer.
  const px = grid.querySelector('[data-pixels]');
  if (px) {
    const cells = [...px.children];
    const card = px.closest('[data-bx]');
    const base = cells.map(() => (Math.random() < 0.3 ? (Math.random() < 0.5 ? 'l1' : 'l2') : ''));
    cells.forEach((c, i) => base[i] && c.classList.add(base[i]));
    if (!reduced) {
      card.addEventListener('pointermove', (e) => {
        cells.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          c.classList.toggle('hot', d < 52);
        });
      });
      card.addEventListener('pointerleave', () => cells.forEach((c) => c.classList.remove('hot')));
      setInterval(() => {
        if (!on(card)) return;
        const c = cells[Math.floor(Math.random() * cells.length)];
        c.classList.toggle('l2');
      }, 500);
    }
  }
}
