// Shared SEO facts and structured data (schema.org JSON-LD).
// Keep these true: search engines and AI assistants quote them directly.
export const SITE = 'https://codvilo.com';
export const EMAIL = 'hello.codvilo@gmail.com';
export const BEHANCE = 'https://www.behance.net/Mohammad-Mohsin';
export const OG_IMAGE = `${SITE}/og.jpg`;

export const SERVICES = [
  { name: 'Ecommerce store design & development', text: 'Custom Shopify and WooCommerce stores, migrations and checkout optimisation, built to load fast and convert on every device.' },
  { name: 'Social media management & content', text: 'Social media strategy, content calendars, short-form video and community management for Instagram, TikTok and Facebook.' },
  { name: 'Website design & development', text: 'Fast, modern websites designed in Figma and built on platforms such as Astro, WordPress and Webflow.' },
  { name: 'Brand identity design', text: 'Logo, colour, typography and brand guidelines shaped into one consistent system.' },
  { name: 'Paid advertising', text: 'Meta, Google and TikTok ad campaigns built on creative testing and clean tracking.' },
  { name: 'SEO & content', text: 'Technical SEO, search-led content and plain-language reporting.' },
];

export const FAQ = [
  {
    q: 'What does Codvilo do?',
    a: 'Codvilo is a digital agency that designs, builds and grows brands online. We build ecommerce stores on Shopify and WooCommerce, design and develop websites, create brand identities, and run social media, paid ads and SEO, all from one team.',
  },
  {
    q: 'Who is behind Codvilo?',
    a: 'Codvilo was founded by Mohsin Manzoor, a UI/UX and product designer who has designed fintech and health apps, dashboards, ecommerce stores and social media campaigns. Mohsin stays involved in every project from the first call to launch.',
  },
  {
    q: 'Do you work with clients outside your country?',
    a: 'Yes. Codvilo is a remote-first studio and works with brands worldwide. Projects run by email and video call, so location and time zone are not a barrier.',
  },
  {
    q: 'Which platforms do you build on?',
    a: 'We build and grow on more than 20 platforms, including Shopify, WooCommerce, WordPress, Webflow, Astro, Stripe, Figma, Meta, Instagram, TikTok, Google Ads, Google Analytics, Mailchimp, HubSpot and Cloudflare.',
  },
  {
    q: 'Can you build or redesign a Shopify store?',
    a: 'Yes. We design and build custom Shopify and WooCommerce stores, migrate existing stores, and improve product pages and checkout so more visitors become customers. Rubai, a kids’ fashion store, is one example in our portfolio.',
  },
  {
    q: 'Do you offer social media management as well as design?',
    a: 'Yes. Alongside one-off social media designs, we plan content calendars, create posts and short-form video, and manage communities, so your feed stays consistent every week.',
  },
  {
    q: 'How does a project with Codvilo start?',
    a: 'Send a message through the contact form at codvilo.com/contact or email hello.codvilo@gmail.com. We read your brief, have a short intro call about your goals, then send a clear proposal with scope, timeline and price before any work begins.',
  },
];

export const org = {
  '@type': 'ProfessionalService',
  '@id': `${SITE}/#organization`,
  name: 'Codvilo',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/logo.svg` },
  image: OG_IMAGE,
  email: EMAIL,
  description: 'Codvilo is a digital agency for ecommerce, social media, web design, branding, paid ads and SEO. One team that designs, builds and grows brands online, working with clients worldwide.',
  slogan: 'Make your next move matter.',
  founder: { '@id': `${SITE}/#founder` },
  areaServed: { '@type': 'Place', name: 'Worldwide' },
  knowsAbout: ['Ecommerce', 'Shopify', 'WooCommerce', 'Web design', 'Web development', 'UI/UX design', 'Brand identity', 'Social media marketing', 'Paid advertising', 'Search engine optimisation'],
  sameAs: [BEHANCE],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: EMAIL, url: `${SITE}/contact/`, availableLanguage: ['English'] },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Codvilo services',
    itemListElement: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, description: s.text, provider: { '@id': `${SITE}/#organization` } } })),
  },
};

export const founder = {
  '@type': 'Person',
  '@id': `${SITE}/#founder`,
  name: 'Mohsin Manzoor',
  jobTitle: 'Founder & Design Lead',
  image: `${SITE}/about/mohsin-manzoor.webp`,
  worksFor: { '@id': `${SITE}/#organization` },
  sameAs: [BEHANCE],
  knowsAbout: ['UI/UX design', 'Product design', 'Ecommerce', 'Brand identity', 'Social media design'],
};

export const website = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: 'Codvilo',
  publisher: { '@id': `${SITE}/#organization` },
  inLanguage: 'en',
};

export const breadcrumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
});

export const faqPage = {
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

/** Wrap nodes in one @graph that always includes the organisation, founder and website. */
export const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': [org, founder, website, ...nodes.filter(Boolean)] });
