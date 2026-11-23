// Contact page: form validation + submit to /api/contact, chips, copy button, local clock.
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const EMAIL = 'hello.codvilo@gmail.com';

const form = $('[data-form]');
const done = $('[data-done]');
const alertBox = $('[data-alert]');
const send = $('[data-send]');
const started = Date.now();

// Card spotlight follows the pointer.
$$('.ct-card').forEach((c) => c.addEventListener('pointermove', (e) => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', `${e.clientX - r.left}px`);
  c.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

// Chips: multi-select for services, single-select for budget and timeline.
const chips = {};
$$('[data-chips]').forEach((group) => {
  const key = group.dataset.chips;
  const single = group.hasAttribute('data-single');
  chips[key] = () => $$('.chip[aria-pressed="true"]', group).map((b) => b.dataset.value);
  group.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    if (single) $$('.chip', group).forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
  });
});

// Message counter.
const msg = $('[data-msg]');
const count = $('[data-count]');
const updateCount = () => { count.textContent = `${msg.value.length} / 5000`; };
msg.addEventListener('input', updateCount);

// Validation.
const setErr = (name, text) => {
  const err = $(`[data-err="${name}"]`);
  if (!err) return;
  err.textContent = text || '';
  err.closest('.fld').classList.toggle('is-bad', !!text);
};
const validate = (d) => {
  const errs = {};
  if (d.name.trim().length < 2) errs.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) errs.email = 'Please enter a valid email address.';
  if (d.message.trim().length < 10) errs.message = 'Tell us a little more (at least 10 characters).';
  return errs;
};
['name', 'email', 'message'].forEach((n) => form.elements[n].addEventListener('input', () => setErr(n, '')));

const mailtoFallback = (d) => {
  const body = [`Name: ${d.name}`, `Email: ${d.email}`, d.company && `Company: ${d.company}`, d.services.length && `Services: ${d.services.join(', ')}`, d.budget && `Budget: ${d.budget}`, d.timeline && `Timeline: ${d.timeline}`, '', d.message].filter((x) => x !== false && x !== undefined && x !== '').join('\n');
  return `mailto:${EMAIL}?subject=${encodeURIComponent(`New project enquiry from ${d.name}`)}&body=${encodeURIComponent(body)}`;
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.hidden = true;
  const d = {
    name: form.elements.name.value, email: form.elements.email.value, company: form.elements.company.value,
    message: form.elements.message.value, website: form.elements.website.value,
    services: chips.services(), budget: chips.budget()[0] || '', timeline: chips.timeline()[0] || '', elapsed: Date.now() - started,
  };
  const errs = validate(d);
  ['name', 'email', 'message'].forEach((n) => setErr(n, errs[n]));
  if (Object.keys(errs).length) { form.elements[Object.keys(errs)[0]].focus(); return; }

  send.classList.add('is-busy');
  $('.ct-send__label', send).textContent = 'Sending…';
  try {
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      $('[data-done-text]').textContent = `Thanks, ${d.name.trim().split(' ')[0]}! Your message is in our inbox. We’ll reply to ${d.email.trim()} soon.`;
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
      alertBox.innerHTML = `We couldn’t send your message just now. <a href="${mailtoFallback(d)}">Send it by email instead</a>. Everything you typed is already filled in.`;
      alertBox.hidden = false;
    }
  } finally {
    send.classList.remove('is-busy');
    $('.ct-send__label', send).textContent = 'Send message';
  }
});

$('[data-again]').addEventListener('click', () => {
  form.reset();
  $$('.chip').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  updateCount();
  done.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});

// Copy email.
const copyBtn = $('[data-copy]');
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(copyBtn.dataset.copy); } catch { /* clipboard blocked: still show feedback */ }
  copyBtn.classList.add('is-copied');
  $('[data-copy-label]').textContent = 'Copied!';
  setTimeout(() => { copyBtn.classList.remove('is-copied'); $('[data-copy-label]').textContent = 'Copy address'; }, 1800);
});
