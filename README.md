# Codvilo

Agency website for [codvilo.com](https://codvilo.com), built with Astro, GSAP, Lenis and Three.js and hosted on Cloudflare Workers.

## Commands

    npm install
    npm run dev               # local dev server at http://localhost:4321
    npm run build             # static build into ./dist
    npm run deploy            # build + wrangler deploy using Workers static assets
    npm run deploy:embedded   # build + bundle ./dist into the Worker script, then deploy

`deploy` is the standard route. `deploy:embedded` packs every page into the Worker script instead
(used while static-asset upload wasn't available); it works for this site because case-study
images load from Behance's CDN.

Deploying needs a Cloudflare API token with **Account → Workers Scripts → Edit**.

## Where things live

| What | File |
| --- | --- |
| Home page sections | `src/pages/index.astro` |
| Shared layout (head, nav, footer) | `src/layouts/Base.astro` |
| Case studies (text + Behance images) | `src/data/projects.js` |
| Work listing / case study pages | `src/pages/work/` |
| Testimonials (currently samples) | `src/data/content.js` |
| Services bento | `src/components/ServicesBento.astro`, `src/styles/bento.css`, `src/scripts/bento.js` |
| Process illustrations | `src/components/ProcessArt.astro`, `src/styles/process.css` |
| About section | `src/components/AboutStudio.astro`, `src/styles/about.css`, `src/scripts/about.js` |
| Hero 3D logo cubes | `src/scripts/hero3d.js` |
| Global styles | `src/styles/global.css` |

Fonts: Geist (headings), Inter (body), Geist Mono (labels), all with -3% letter spacing.
Brand colours: `#6B5CFF`, `#393797`, `#0A0A0A`.
