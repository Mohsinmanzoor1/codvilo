// Bundles ./dist into a single Worker module (.worker/index.js) for environments
// where Wrangler's static-asset upload is unavailable.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.xml': 'application/xml',
};
const files = {};
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files['/' + path.relative(root, p).split(path.sep).join('/')] = [mime[path.extname(p)] || 'application/octet-stream', fs.readFileSync(p).toString('base64')];
  }
})(root);

const worker = `import { handleContact } from '../worker/contact.js';
const FILES = ${JSON.stringify(files)};
const cache = new Map();
function body(p) {
  if (!cache.has(p)) {
    const bin = atob(FILES[p][1]);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    cache.set(p, buf);
  }
  return cache.get(p);
}
export default {
  fetch(request, env) {
    const url = new URL(request.url);
    // One canonical address: www.codvilo.com -> codvilo.com (permanent).
    if (url.hostname === 'www.codvilo.com') {
      url.hostname = 'codvilo.com';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api/contact') return handleContact(request, env);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    else if (!FILES[p] && FILES[p + '.html']) p += '.html';
    else if (!FILES[p] && FILES[p + '/index.html']) p += '/index.html';
    let status = 200;
    if (!FILES[p]) { p = '/404.html'; status = 404; }
    const headers = {
      'content-type': FILES[p][0],
      'cache-control': p.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff',
    };
    return new Response(request.method === 'HEAD' ? null : body(p), { status, headers });
  },
};
`;
fs.mkdirSync('.worker', { recursive: true });
fs.writeFileSync('.worker/index.js', worker);
console.log(`bundled ${Object.keys(files).length} files, ${(worker.length / 1024).toFixed(0)} KB`);
