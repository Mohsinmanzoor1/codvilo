// /sitemap.xml: every indexable page, with case-study images for Google Images.
import { projects } from '../data/projects.js';
import { SITE } from '../data/seo.js';
import { services } from '../data/services.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const pages = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    { loc: '/work/', priority: '0.9', freq: 'weekly' },
    { loc: '/services/', priority: '0.9', freq: 'monthly' },
    ...services.map((s) => ({ loc: `/services/${s.slug}/`, priority: s.offer ? '0.9' : '0.8', freq: 'weekly' })),
    { loc: '/free-store-audit/', priority: '0.8', freq: 'monthly' },
    { loc: '/contact/', priority: '0.8', freq: 'monthly' },
    ...projects.map((p) => ({ loc: `/work/${p.slug}/`, priority: '0.7', freq: 'monthly', images: p.images.slice(0, 6).map((i, k) => ({ src: i.src, title: k === 0 ? `${p.title}: ${p.subtitle}` : `${p.title} case study image ${k + 1}` })) })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map((p) => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>${(p.images || []).map((i) => `
    <image:image><image:loc>${esc(i.src)}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`).join('')}
  </url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
