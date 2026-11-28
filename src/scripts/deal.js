// Black Friday deal: live countdown, and automatic switch to the regular price
// once the deal ends (so the site never shows an expired deal, even without a redeploy).
const scopes = [...document.querySelectorAll('[data-deal-scope]')];
const banner = document.querySelector('[data-deal-banner]');
const ends = new Date((scopes[0] || banner)?.dataset.ends || 0);

const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const apply = () => {
  const left = ends - Date.now();
  const live = left > 0;
  document.documentElement.classList.toggle('deal-live', live);
  document.documentElement.classList.toggle('deal-over', !live);
  document.querySelectorAll('[data-countdown]').forEach((el) => { el.textContent = live ? fmt(left) : 'ended'; });
  if (banner && !live) banner.remove();
  return live;
};

if (!Number.isNaN(ends.getTime())) {
  if (apply()) {
    const t = setInterval(() => { if (!apply()) clearInterval(t); }, 1000);
  }
}

// Dismissible banner (remembered for this browser session).
if (banner) {
  try { if (sessionStorage.getItem('cv-deal-dismissed') === '1') banner.remove(); } catch {}
  banner.querySelector('[data-deal-close]')?.addEventListener('click', () => {
    banner.classList.add('is-gone');
    try { sessionStorage.setItem('cv-deal-dismissed', '1'); } catch {}
    setTimeout(() => banner.remove(), 500);
  });
  requestAnimationFrame(() => setTimeout(() => banner.classList.add('is-in'), 1600));
}
