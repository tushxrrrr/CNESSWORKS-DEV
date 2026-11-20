// Serves the static export (out/) for local review and the browser tests: node scripts/serve-out.mjs [port]
// /analyze resolves to out/analyze.html, as on a static host.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const ROOT = join(process.cwd(), 'out'), PORT = Number(process.argv[2] || 3100);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const exists = async p => { try { return (await stat(p)).isFile(); } catch { return false; } };
createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  let p = normalize(join(ROOT, url)); if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (!(await exists(p))) p = (await exists(p + '.html')) ? p + '.html' : join(p, 'index.html');
  if (!(await exists(p))) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p));
}).listen(PORT, () => console.log(`serving out/ at http://localhost:${PORT}`));
