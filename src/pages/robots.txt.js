// /robots.txt: open to search engines and AI search/assistant crawlers.
import { SITE } from '../data/seo.js';

export function GET() {
  const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot', 'Meta-ExternalAgent', 'DuckAssistBot'];
  const body = `# Codvilo: search engines and AI assistants are welcome.
User-agent: *
Allow: /
Disallow: /api/

${aiBots.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /api/`).join('\n\n')}

Sitemap: ${SITE}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
