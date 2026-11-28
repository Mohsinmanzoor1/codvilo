// POST /api/contact — validates a contact-form submission and emails it to the
// studio inbox through Cloudflare Email Routing (send_email binding "CONTACT",
// whose destination is the verified address in wrangler.embedded.jsonc).
import { EmailMessage } from 'cloudflare:email';

const FROM = 'website@codvilo.com';
const TO = 'hello.codvilo@gmail.com';
const ALLOWED_ORIGINS = ['https://codvilo.com', 'https://www.codvilo.com', 'https://codvilo.codvilo.workers.dev', 'http://localhost:4321', 'http://localhost:8787'];
const SERVICES = ['Ecommerce store', 'Social media', 'Web design & development', 'Brand identity', 'Paid advertising', 'SEO & content'];
const BUDGETS = ['Under $1k', '$1k–3k', '$3k–10k', '$10k+', 'Not sure yet'];
const TIMELINES = ['As soon as possible', 'Within 1–3 months', 'Flexible'];
const PLATFORMS = ['Shopify', 'WooCommerce', 'Other / not sure'];
const PROBLEMS = ['Not enough sales', 'Slow store', 'Looks outdated', 'Checkout drop-offs', 'Poor mobile experience', 'Low traffic'];
const OFFERS = { 'shopify-deal': 'Black Friday: complete Shopify store ($499)' };

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (v, max) => (typeof v === 'string' ? v.replace(/\r/g, '').trim().slice(0, max) : '');
const oneLine = (v) => v.replace(/[\n\t]+/g, ' ');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const b64 = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };
const wrap76 = (s) => s.replace(/.{1,76}/g, '$&\r\n').trim();
const encHeader = (s) => `=?UTF-8?B?${b64(s)}?=`;

export async function handleContact(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ ok: false, error: 'Origin not allowed' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 20000) return json({ ok: false, error: 'Message too large' }, 413);

  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'Invalid request' }, 400); }

  // Spam traps: a hidden field humans never fill, and a minimum time on the form.
  if (clean(d.website, 200)) return json({ ok: true });
  if (Number(d.elapsed) > 0 && Number(d.elapsed) < 2500) return json({ ok: true });

  const name = oneLine(clean(d.name, 100));
  const email = oneLine(clean(d.email, 160));
  const company = oneLine(clean(d.company, 120));
  const message = clean(d.message, 5000);
  const services = Array.isArray(d.services) ? d.services.filter((s) => SERVICES.includes(s)).slice(0, 6) : [];
  const budget = BUDGETS.includes(d.budget) ? d.budget : '';
  const timeline = TIMELINES.includes(d.timeline) ? d.timeline : '';
  const isAudit = d.kind === 'audit';
  const storeUrl = oneLine(clean(d.storeUrl, 200));
  const platform = PLATFORMS.includes(d.platform) ? d.platform : '';
  const problems = Array.isArray(d.problems) ? d.problems.filter((p) => PROBLEMS.includes(p)).slice(0, 6) : [];
  const offer = OFFERS[d.offer] || '';

  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (isAudit) { if (!/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(storeUrl)) errors.storeUrl = 'Please enter your store address, e.g. yourstore.com'; }
  else if (message.length < 10) errors.message = 'Tell us a little more (at least 10 characters).';
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  if (!env.CONTACT) return json({ ok: false, error: 'Email is not configured yet.' }, 503);

  const rows = isAudit
    ? [['Store', storeUrl], ['Platform', platform || '—'], ['Problems', problems.join(', ') || '—'], ['Name', name], ['Email', email]]
    : [...(offer ? [['Offer', offer]] : []), ['Name', name], ['Email', email], ['Company / brand', company || '—'], ['Services', services.join(', ') || '—'], ['Budget', budget || '—'], ['Timeline', timeline || '—']];
  const heading = isAudit ? 'Free store audit request' : offer ? 'Black Friday deal enquiry' : 'New project enquiry';
  const text = `${heading} from codvilo.com\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nMessage:\n${message || '(none)'}\n\n— Reply to this email to answer ${name} directly.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f3f8;font-family:Inter,Arial,sans-serif;color:#0a0a0a">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="margin:0 0 6px;font:12px/1 monospace;letter-spacing:.08em;text-transform:uppercase;color:#6b5cff">${heading}</p>
<h1 style="margin:0 0 20px;font-size:22px;font-weight:600">${esc(name)}${company ? ` · ${esc(company)}` : ''}</h1>
<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:14px">
${rows.map(([k, v]) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #eee;color:#6f6e69;width:38%">${k}</td><td style="padding:10px 14px;border-bottom:1px solid #eee">${k === 'Email' ? `<a href="mailto:${esc(v)}" style="color:#6b5cff">${esc(v)}</a>` : esc(v)}</td></tr>`).join('')}
</table>
<div style="margin-top:16px;background:#fff;border-radius:12px;padding:16px 14px;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(message || '(no extra message)')}</div>
<p style="margin:16px 0 0;font-size:12px;color:#8d8b86">Sent from the contact form on codvilo.com. Reply to this email to answer ${esc(name)} directly.</p>
</div></body></html>`;

  const boundary = `cv_${crypto.randomUUID()}`;
  const raw = [
    `From: ${encHeader('Codvilo Website')} <${FROM}>`,
    `To: <${TO}>`,
    `Reply-To: ${encHeader(name)} <${email}>`,
    `Subject: ${encHeader(isAudit ? `Audit request: ${storeUrl} (${name})` : offer ? `Black Friday deal: ${name}${company ? ` (${company})` : ''}` : `New enquiry: ${name}${company ? ` (${company})` : ''}`)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@codvilo.com>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(text)),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(html)),
    `--${boundary}--`,
    '',
  ].join('\r\n');

  try {
    await env.CONTACT.send(new EmailMessage(FROM, TO, raw));
    return json({ ok: true });
  } catch (e) {
    console.error('contact send failed', e && e.message);
    return json({ ok: false, error: 'We could not send your message right now.' }, 502);
  }
}
