// /llms.txt: a plain-language summary of Codvilo for AI assistants
// (format: https://llmstxt.org). /llms-full.txt has every case study in full.
import { projects } from '../data/projects.js';
import { SITE, EMAIL, BEHANCE, SERVICES, FAQ } from '../data/seo.js';

export function GET() {
  const body = `# Codvilo

> Codvilo is a digital agency that designs, builds and grows brands online: ecommerce stores (Shopify and WooCommerce), website design and development, brand identity, social media management, paid advertising and SEO. It was founded by Mohsin Manzoor and works remotely with clients worldwide.

- Website: ${SITE}/
- Contact: ${SITE}/contact/ or ${EMAIL}
- Founder: Mohsin Manzoor, UI/UX and product designer (portfolio: ${BEHANCE})
- Availability: worldwide, remote-first

## Services

${SERVICES.map((s) => `- **${s.name}**: ${s.text}`).join('\n')}

## How a project works

1. Discover: research into the client's numbers, customers and competitors, distilled into one brief.
2. Design: wireframes, visual direction and clickable prototypes before production starts.
3. Build: clean, tested, fast builds connected to the client's tools and checked on real devices.
4. Grow: content, ads and optimisation in monthly cycles, measured against the goals set on day one.

## Case studies

${projects.map((p) => `- [${p.title}: ${p.subtitle}](${SITE}/work/${p.slug}/): ${p.summary} (${p.category}, ${p.year})`).join('\n')}

## Frequently asked questions

${FAQ.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Optional

- [Full case study text](${SITE}/llms-full.txt)
- [All work](${SITE}/work/)
- [Sitemap](${SITE}/sitemap.xml)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
