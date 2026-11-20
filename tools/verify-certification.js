#!/usr/bin/env node
// Verifies the built Certification experience against the locked inventories, page by page.
//  1. Every element tagged data-k="<page>:<path>" shows exactly the inventory value at that path
//     (links: label text and production URL; links between the three pages route to #<route>).
//  2. Every approved string in each inventory is rendered somewhere on its own page (no omissions).
//  3. Tagged elements follow the inventory's reading order.
//  4. Shared header, footer and quick actions keep the site's labels and destinations.
// Usage: node tools/verify-certification.js [page.html]  (default certification.html). Exit 1 on any difference.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const PAGE = path.resolve(ROOT, process.argv[2] || 'certification.html');
const B = 'https://www.cnessworks.com';
const INV = { moc: 'mother-of-certification', org: 'cness-certification', prd: 'product-certification' };
const DATA = Object.fromEntries(Object.entries(INV).map(([k, f]) => [k, JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f + '.json'), 'utf8'))]));
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/cness-advantage.json'), 'utf8'));
const ROUTES = { [B + '/mother-of-certification']: 'mother-of-certification', [B + '/cness-certification']: 'cness-certification', [B + '/product-certification']: 'product-certification' };
// Not page copy: metadata, interface labels and behaviour descriptions (accounted for separately in the handoff).
const SKIP = new Set(['source', 'route', 'captured', 'note', 'matches', 'omitted', 'emblem', 'slug', 'img', 'origin', 'image', 'controls', 'dialogControls', 'search', 'name', 'href', 'progressEmphasis']);
const norm = s => String(s).replace(/[\s​]+/g, ' ').trim();
const get = (o, p) => p.split('.').reduce((v, k) => v == null ? v : v[k], o);
function leaves(o, p = '', out = []) {
  if (typeof o === 'string') { out.push(p); return out; }
  if (Array.isArray(o)) { o.forEach((v, i) => leaves(v, p ? `${p}.${i}` : `${i}`, out)); return out; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (SKIP.has(k)) continue; if (p.includes('logos') && (k === 'name' || k === 'text')) continue; if (k === 'less') continue; leaves(v, p ? `${p}.${k}` : k, out); }
  return out;
}
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.route('https://cdn.jsdelivr.net/**', r => r.abort());
  const diffs = []; const bad = (m) => diffs.push(m); const report = [];
  for (const [key, route] of Object.entries(INV)) {
    await pg.goto('file://' + PAGE + '#' + route); await pg.waitForTimeout(500);
    const got = await pg.evaluate(k => {
      const txt = el => { const c = el.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove()); return c.textContent.replace(/[\s​]+/g, ' ').trim(); };
      const art = document.querySelector(`.pg[data-page="${k}"]`);
      return { visible: !art.hidden, items: [...art.querySelectorAll('[data-k]')].map(e => ({ k: e.dataset.k, text: txt(e), tag: e.tagName, href: e.getAttribute('href'), prod: e.getAttribute('data-prod-href'), route: e.getAttribute('data-route') })),
        strayKeys: [...document.querySelectorAll('[data-k]')].filter(e => !art.contains(e) && e.dataset.k.startsWith(k + ':')).length,
        foreign: [...art.querySelectorAll('[data-k]')].filter(e => !e.dataset.k.startsWith(k + ':')).length };
    }, key);
    if (!got.visible) bad(`${route}: page not shown for #${route}`);
    if (got.foreign) bad(`${route}: ${got.foreign} element(s) from another page's inventory inside this page`);
    const D = DATA[key], covered = new Set(), order = leaves(D);
    for (const it of got.items) {
      const p = it.k.slice(key.length + 1), v = get(D, p);
      if (v === undefined) { bad(`${route}: ${p} not in inventory`); continue; }
      if (typeof v === 'string' && /\.url$/.test(p)) {          // whole-card links: destination check
        if (it.prod !== v) bad(`${route}: ${p} links to ${it.prod}, expected ${v}`);
        if (ROUTES[v] ? it.href !== '#' + ROUTES[v] : it.href !== v) bad(`${route}: ${p} href ${it.href}`);
        covered.add(p); continue;
      }
      if (v && typeof v === 'object' && 'url' in v) {           // labelled links
        if (it.text !== norm(v.text)) bad(`${route}: ${p}.text expected ${JSON.stringify(v.text)} got ${JSON.stringify(it.text)}`);
        if (it.prod !== v.url) bad(`${route}: ${p} production URL ${it.prod}, expected ${v.url}`);
        if (ROUTES[v.url] ? (it.href !== '#' + ROUTES[v.url] || it.route !== ROUTES[v.url]) : it.href !== v.url) bad(`${route}: ${p} href ${it.href} for ${v.url}`);
        covered.add(p + '.text'); covered.add(p + '.url'); continue;
      }
      if (typeof v !== 'string') { bad(`${route}: ${p} is not a string`); continue; }
      if (it.text !== norm(v)) bad(`${route}: ${p} expected ${JSON.stringify(norm(v).slice(0, 90))} got ${JSON.stringify(it.text.slice(0, 90))}`);
      covered.add(p);
    }
    if (key === 'moc') { const lessOk = await pg.evaluate(() => document.getElementById('moc-more').dataset.less); if (lessOk !== D.industry.less) bad(`${route}: Show less label ${lessOk}`); }
    const missing = order.filter(p => !covered.has(p));
    missing.forEach(p => bad(`${route}: not rendered: ${p} = ${JSON.stringify(String(get(D, p)).slice(0, 80))}`));
    // reading order: tagged elements in DOM order must follow the inventory order
    const pos = new Map(order.map((p, i) => [p, i])); let last = -1, inv = 0;
    for (const it of got.items) { const p = it.k.slice(key.length + 1); if (/\.url$/.test(p)) continue; const i = pos.has(p) ? pos.get(p) : pos.get(p + '.text'); if (i == null) continue; if (i < last) { inv++; if (inv <= 30) bad(`${route}: order: ${p} appears after a later item`); } last = Math.max(last, i); }
    report.push(`${route}: ${got.items.length} tagged elements, ${order.length} approved strings, ${missing.length} not rendered, ${inv} out of order`);
  }
  // shared chrome
  const chrome = await pg.evaluate(() => {
    const txt = el => { const c = el.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
    const L = sel => [...document.querySelectorAll(sel)].map(a => [txt(a), a.getAttribute('data-prod-href') || a.getAttribute('href'), a.getAttribute('href')]);
    return { nav: L('header .nav a'), sheet: L('#sheet a'), foot: [...document.querySelectorAll('.foot > div:not(.about)')].map(d => [txt(d.querySelector('h3')), [...d.querySelectorAll('li')].map(li => { const a = li.querySelector(':scope > a'); return a ? [txt(a), a.getAttribute('data-prod-href') || a.getAttribute('href')] : [txt(li.querySelector('button'))]; })]),
      social: [...document.querySelectorAll('.soc a')].map(a => [a.getAttribute('aria-label'), a.getAttribute('href')]), quick: [...document.querySelectorAll('.qa')].map(a => [txt(a.querySelector('b')), txt(a.querySelector('small')), a.getAttribute('href')]),
      tagline: txt(document.querySelector('.foot .about p')), copyright: txt(document.querySelector('.legal')), routed: [...document.querySelectorAll('a[data-route]')].map(a => [a.getAttribute('href'), a.getAttribute('data-prod-href')]) };
  });
  const H = SITE.header, flat = H.nav.flatMap(n => n.menu ? n.menu : [n]);
  const expNav = flat.map(l => [l.text, l.url]);
  if (JSON.stringify(chrome.nav.map(x => [x[0], x[1]])) !== JSON.stringify(expNav)) bad('header nav labels or destinations differ');
  chrome.nav.forEach(([t, prod, h]) => { if (ROUTES[prod] && h !== '#' + ROUTES[prod]) bad(`header: ${t} does not route in the preview`); });
  if (JSON.stringify(chrome.sheet.slice(0, flat.length + 1).map(x => [x[0], x[1]])) !== JSON.stringify([[H.mobileOnly[0].text, H.mobileOnly[0].url], ...expNav])) bad('mobile menu labels or destinations differ');
  const F = SITE.footer;
  if (JSON.stringify(chrome.foot) !== JSON.stringify(F.columns.map(c => [c.title, (c.links || c.items).map(l => l.url ? [l.text, l.url] : [l.text])]))) bad('footer columns differ');
  if (JSON.stringify(chrome.social) !== JSON.stringify(F.social.map(s => [s.text, s.url]))) bad('footer social links differ');
  if (chrome.tagline !== F.tagline || chrome.copyright !== F.copyright) bad('footer text differs');
  if (JSON.stringify(chrome.quick) !== JSON.stringify(SITE.quickActions.map(q => [q.text, q.tag, q.url]))) bad('quick actions differ');
  chrome.routed.forEach(([h, prod]) => { if (h !== '#' + ROUTES[prod]) bad(`routed link ${prod} -> ${h}`); });
  await b.close();
  console.log(report.join('\n')); console.log(`Shared chrome: ${chrome.nav.length} header links, ${chrome.foot.reduce((n, c) => n + c[1].length, 0)} footer items, ${chrome.routed.length} links routed between the three pages.`);
  if (diffs.length) { console.log(`${diffs.length} difference(s):\n` + diffs.slice(0, 60).join('\n')); process.exit(1); }
  console.log('No differences from the approved content.');
})();
