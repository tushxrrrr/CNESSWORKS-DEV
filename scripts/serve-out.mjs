// Serves the static export (out/) the way a production static host does, for local review and the browser tests:
// node scripts/serve-out.mjs [port]
//  - /analyze and /analyze/ both serve out/analyze.html (the live site answers both forms);
//  - unknown paths get out/404.html with status 404;
//  - responses are gzip-compressed when the browser accepts it;
//  - fingerprinted files under /_next/static are cached for a year, pages are revalidated;
//  - with NEXT_PUBLIC_BASE_PATH set (the same value the build used), the app is served under that sub-path.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
const ROOT = join(process.cwd(), 'out'), PORT = Number(process.argv[2] || 3100);
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const ZIP = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);
const exists = async p => { try { return (await stat(p)).isFile(); } catch { return false; } };
createServer(async (req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  if (BASE) { if (url !== BASE && !url.startsWith(BASE + '/')) { res.writeHead(404).end('Not found'); return; } url = url.slice(BASE.length) || '/'; }
  let p = normalize(join(ROOT, url)); if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (!(await exists(p))) { const bare = p.replace(/\/+$/, ''); p = (await exists(bare + '.html')) ? bare + '.html' : join(p, 'index.html'); }
  let status = 200;
  if (!(await exists(p))) { p = join(ROOT, '404.html'); status = 404; }
  const ext = extname(p); let body = await readFile(p);
  const headers = { 'content-type': TYPES[ext] || 'application/octet-stream', 'x-content-type-options': 'nosniff',
    'cache-control': url.startsWith('/_next/static/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate' };
  if (ZIP.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { body = gzipSync(body); headers['content-encoding'] = 'gzip'; headers.vary = 'Accept-Encoding'; }
  res.writeHead(status, headers).end(body);
}).listen(PORT, () => console.log(`serving out/ at http://localhost:${PORT}${BASE}`));
