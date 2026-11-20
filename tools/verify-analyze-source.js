#!/usr/bin/env node
// Re-checks content/analyze.json against the live page https://www.cnessworks.com/analyze.
// SAFETY: every non-GET request is aborted inside the browser, so no rating, form value or email can be sent.
// Walks both paths (rating every pillar, opening the details form) and collects rendered text, placeholders
// and option labels; strings that render only on interaction (validation messages, busy labels) are looked up
// in the page's own JavaScript. Usage: node tools/verify-analyze-source.js   Exit 1 if anything is missing.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const INV = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/analyze.json'), 'utf8'));
const SKIP = new Set(['source', 'captured', 'note', 'rules', 'omitted', 'key', 'id', 'type', 'options']);
const norm = s => String(s).replace(/\s+/g, ' ').trim();
function leaves(o, p = '', out = []) { if (typeof o === 'string') { out.push([p, o]); return out; } if (Array.isArray(o)) { o.forEach((v, i) => leaves(v, `${p}.${i}`, out)); return out; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (!SKIP.has(k)) leaves(v, p ? `${p}.${k}` : k, out); } return out; }
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const blocked = []; let js = '';
  await p.route('**/*', r => { const q = r.request(); if (q.method() !== 'GET') { blocked.push(q.method() + ' ' + q.url()); return r.abort(); } return r.continue(); });
  p.on('response', async r => { if (/_next\/static\/chunks\/.*\.js$/.test(r.url())) { try { js += await r.text(); } catch {} } });
  await p.goto(INV.source, { waitUntil: 'networkidle', timeout: 90000 }); await p.waitForTimeout(1500);
  let text = ''; const grab = async () => { text += '\n' + await p.evaluate(() => document.body.innerText + '\n' + [...document.querySelectorAll('[placeholder]')].map(e => e.getAttribute('placeholder')).join('\n') + '\n' + [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join('\n')); };
  for (const [tab, n] of [['analyze-track-org', 6], ['analyze-track-product', 7]]) {
    await p.click(`[data-testid="${tab}"]`); await p.waitForTimeout(800); await grab();
    for (let i = 0; i < n; i++) { await p.click('[data-testid="analyze-score-rating-5"]'); await p.waitForTimeout(120); await grab(); await p.click('[data-testid="analyze-score-next"]'); await p.waitForTimeout(500); }
    await grab();
  }
  const T = norm(text), J = js.replace(/\\u2019/g, '’').replace(/\\u2014/g, '—').replace(/\\u2026/g, '…').replace(/\\u2013/g, '–').replace(/\\"/g, '"').replace(/\\n/g, '\n');
  const tmpl = new Set(['scorer.progress', 'scorer.pillarTitle', 'scorer.ratingGroup', 'scorer.outOf', 'scorer.none']);
  let live = 0, code = 0; const missing = [];
  for (const [k, v] of leaves(INV)) {
    if (tmpl.has(k)) continue;
    const s = norm(v), u = /^https:\/\/www\.cnessworks\.com(\/.*)$/.exec(v);
    if (T.includes(s)) live++; else if (J.includes(v) || J.includes(s) || (u && J.includes(u[1]))) code++; else missing.push(k + ' = ' + s.slice(0, 80));
  }
  await b.close();
  console.log(`${live} strings found on the rendered live page, ${code} in the page's own code (interaction-only states), ${missing.length} missing.`);
  console.log(`Requests blocked (never sent): ${blocked.length ? blocked.join(', ') : 'none'}`);
  if (missing.length) { console.log(missing.join('\n')); process.exit(1); }
})();
