// /llms-full.txt: every Codvilo case study as plain text for AI assistants.
import { projects } from '../data/projects.js';
import { SITE, EMAIL } from '../data/seo.js';

export function GET() {
  const body = `# Codvilo: full case studies

Codvilo is a digital agency founded by Mohsin Manzoor, working with clients worldwide. Contact: ${SITE}/contact/ or ${EMAIL}.

${projects.map((p) => `---

## ${p.title}: ${p.subtitle}

- URL: ${SITE}/work/${p.slug}/
- Category: ${p.category}
- Year: ${p.year}
- Client: ${p.client}
- Services: ${p.services.join(', ')}
- Tools: ${p.tools.join(', ')}

**Summary:** ${p.summary}

**Overview:** ${p.overview}

**Challenge:** ${p.challenge}

**Solution:** ${p.solution}

**Process:** ${p.process.join(' → ')}
${p.insights.length ? `\n**Research insights:**\n${p.insights.map((i) => `- ${i.value}: ${i.label}`).join('\n')}\n` : ''}${p.details.length ? `\n**Design details:**\n${p.details.map((d) => `- ${d.label}: ${d.value}`).join('\n')}\n` : ''}`).join('\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
