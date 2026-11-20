#!/usr/bin/env node
// Checks the locked certification inventories against the LIVE cnessworks.com pages:
// every approved string in content/<page>.json must appear in the live page text (after opening the
// states that only render on interaction). FAQ answers come from the site's FAQ API, which this
// check cannot reach from a sandbox; they are reported separately.
// Usage: node tools/verify-certification-source.js
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
// Interface fields (image paths, alt text, logo accessible names, button labels) are not page copy and are checked by the page verifier instead.
const SKIP = new Set(['url', 'href', 'img', 'origin', 'route', 'source', 'captured', 'note', 'matches', 'omitted', 'emblem', 'slug', 'controls', 'dialogControls', 'image', 'logos']);
const norm = s => s.replace(/[\s​]+/g, ' ').trim();
function strings(o, key, out, ctx) {
  if (typeof o === 'string') { if (!SKIP.has(key)) out.push({ s: o, ctx }); return out; }
  if (Array.isArray(o)) { o.forEach(v => strings(v, key, out, ctx)); return out; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (SKIP.has(k)) continue; strings(v, k, out, ctx || k === 'tabs' ? (ctx || 'faq') : ctx); }
  return out;
}
const PAGES = ['mother-of-certification', 'cness-certification', 'product-certification'];
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const name of PAGES) {
    const inv = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', name + '.json'), 'utf8'));
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(inv.source, { waitUntil: 'networkidle', timeout: 90000 });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(50); }
    const grab = () => p.evaluate(() => document.body.textContent + ' ' + [...document.querySelectorAll('input')].map(i => i.placeholder).join(' '));
    let text = await grab();
    if (name === 'mother-of-certification') { await p.locator('main button', { hasText: /^Show more$/ }).click(); await p.waitForTimeout(400); text += await grab(); await p.fill('main input', 'zzzz'); await p.waitForTimeout(400); text += await grab(); }
    if (name === 'cness-certification') {
      for (let i = 0; i < 6; i++) { await p.locator('button', { hasText: new RegExp('^0' + (i + 1)) }).first().click(); await p.waitForTimeout(400); text += await grab(); await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
      const idx = await p.evaluate(() => [...document.querySelectorAll('button')].map((b, i) => (!b.textContent.trim() && !b.getAttribute('aria-label')) ? i : -1).filter(i => i >= 0));
      await p.locator('button').nth(idx[1]).click(); await p.waitForTimeout(900); text += await grab();
    }
    const T = norm(text), Tn = T.replace(/ /g, '');
    const all = strings(inv, '', []);
    const miss = all.filter(x => x.ctx !== 'faq' && !T.includes(norm(x.s)) && !Tn.includes(norm(x.s).replace(/ /g, '')));
    const faq = all.filter(x => x.ctx === 'faq');
    console.log(`${name}: ${all.length - faq.length} strings checked against the live page, ${miss.length} not found` + (faq.length ? `; ${faq.length} FAQ strings come from the FAQ API (not reachable from this check)` : ''));
    miss.forEach(x => console.log('   missing:', JSON.stringify(x.s.slice(0, 120))));
    bad += miss.length; await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
