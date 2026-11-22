// ─────────────────────────────────────────────────────────────────────────────
// Edit this file to update the "Selected work" and "Testimonials" sections.
//
// Every entry below is a SAMPLE. Replace them with real projects and real client
// quotes (with the client's permission). Set `sample: false` (or delete the line)
// once an entry is real, and the "Sample" badge disappears.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * visual: 'store' | 'social' | 'site' | 'ads'  — which built-in mock-up to show.
 * theme:  background colours of the card visual [from, to].
 * image:  optional path to a real screenshot in /public (e.g. '/work/brand.jpg');
 *         when set it replaces the mock-up.
 * url:    optional link to the live project.
 */
export const work = [
  {
    sample: true,
    title: 'Apparel store',
    summary: 'Shopify build and migration with a faster, simpler checkout.',
    tags: ['Ecommerce', 'Shopify'],
    year: '2026',
    visual: 'store',
    theme: ['#6B5CFF', '#393797'],
    brand: 'Northline',
  },
  {
    sample: true,
    title: 'Skincare brand',
    summary: 'Social strategy, monthly content and short-form video.',
    tags: ['Social media', 'Content'],
    year: '2026',
    visual: 'social',
    theme: ['#EDE6DB', '#D9CDBC'],
    brand: 'Saltleaf',
  },
  {
    sample: true,
    title: 'Restaurant group',
    summary: 'New website, online menu and local SEO across three locations.',
    tags: ['Web design', 'Local SEO'],
    year: '2025',
    visual: 'site',
    theme: ['#141414', '#262433'],
    brand: 'Ember & Co',
  },
  {
    sample: true,
    title: 'Home goods',
    summary: 'Meta and TikTok campaigns built on creative testing.',
    tags: ['Paid ads', 'Meta', 'TikTok'],
    year: '2025',
    visual: 'ads',
    theme: ['#E7E4FF', '#C9C3FF'],
    brand: 'Hearth',
  },
];

/** initials are shown in the avatar when no photo is given. */
export const testimonials = [
  {
    sample: true,
    quote: 'Your client’s words go here: a short quote about working with Codvilo and the result it delivered.',
    name: 'Client name',
    role: 'Role, Company',
    initials: 'CN',
  },
  {
    sample: true,
    quote: 'A second testimonial. Keep it to two or three sentences and lead with the outcome the client cares about most.',
    name: 'Client name',
    role: 'Role, Company',
    initials: 'CN',
  },
  {
    sample: true,
    quote: 'A third testimonial. Real quotes from real clients, used with their permission, build the most trust.',
    name: 'Client name',
    role: 'Role, Company',
    initials: 'CN',
  },
];
