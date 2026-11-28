// Free store audit form: validation + submit to /api/contact (kind: "audit").
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const form = $('[data-audit-form]');
if (form) {
  const done = $('[data-done]');
  const alertBox = $('[data-alert]');
  const send = $('[data-send]');
  const started = Date.now();

  $$('.ct-card').forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  const chips = {};
  $$('[data-chips]').forEach((group) => {
    const single = group.hasAttribute('data-single');
    chips[group.dataset.chips] = () => $$('.chip[aria-pressed="true"]', group).map((b) => b.dataset.value);
    group.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const on = b.getAttribute('aria-pressed') !== 'true';
      if (single) $$('.chip', group).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(single ? true : on));
    });
  });

  const setErr = (name, text) => {
    const err = $(`[data-err="${name}"]`);
    if (!err) return;
    err.textContent = text || '';
    err.closest('.fld').classList.toggle('is-bad', !!text);
  };
  ['storeUrl', 'name', 'email'].forEach((n) => form.elements[n].addEventListener('input', () => setErr(n, '')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.hidden = true;
    const d = {
      kind: 'audit',
      storeUrl: form.elements.storeUrl.value.trim(), name: form.elements.name.value, email: form.elements.email.value,
      platform: chips.platform()[0] || '', problems: chips.problems(), message: form.elements.message.value, website: form.elements.website.value,
      elapsed: Date.now() - started,
    };
    const errs = {};
    if (!/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(d.storeUrl)) errs.storeUrl = 'Please enter your store address, e.g. yourstore.com';
    if (d.name.trim().length < 2) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) errs.email = 'Please enter a valid email address.';
    ['storeUrl', 'name', 'email'].forEach((n) => setErr(n, errs[n]));
    if (Object.keys(errs).length) { form.elements[Object.keys(errs)[0]].focus(); return; }

    send.classList.add('is-busy');
    $('.ct-send__label', send).textContent = 'Sending…';
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        $('[data-done-text]').textContent = `Thanks, ${d.name.trim().split(' ')[0]}! We’ll review ${d.storeUrl.replace(/^https?:\/\//, '')} and email what we find to ${d.email.trim()}.`;
        form.hidden = true;
        done.hidden = false;
        done.focus();
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (out.errors) { Object.entries(out.errors).forEach(([k, v]) => setErr(k, v)); throw new Error('validation'); }
      throw new Error(out.error || 'send failed');
    } catch (err) {
      if (String(err.message) !== 'validation') {
        const body = encodeURIComponent(`Store: ${d.storeUrl}\nPlatform: ${d.platform}\nProblems: ${d.problems.join(', ')}\n\n${d.message}`);
        alertBox.innerHTML = `We couldn’t send your request just now. <a href="mailto:hello.codvilo@gmail.com?subject=${encodeURIComponent('Free store audit: ' + d.storeUrl)}&body=${body}">Send it by email instead</a>.`;
        alertBox.hidden = false;
      }
    } finally {
      send.classList.remove('is-busy');
      $('.ct-send__label', send).textContent = 'Get my free audit';
    }
  });
}
