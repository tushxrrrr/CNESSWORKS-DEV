#!/usr/bin/env node
// Verifies the built Analyze page against the locked inventory content/analyze.json.
//  1. Every element tagged data-k="<path>" shows exactly the inventory value (aria-hidden decoration ignored;
//     required labels render as "<label> *" with the asterisk hidden from assistive tech, as on the live page).
//  2. Every placeholder tagged data-kp matches; links keep their live destinations.
//  3. Strings used only by script (validation, busy labels, templates) are embedded verbatim in #an-copy.
//  4. Every approved string is rendered or embedded somewhere (no omissions); template strings are checked live.
//  5. Shared header, footer and quick actions keep the site's labels and destinations.
//  6. Text that is not approved copy (the preview disclosure) is listed separately.
// Usage: node tools/verify-analyze.js [page.html | URL]  (default analyze.html). Exit 1 on any difference.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const ARG = process.argv[2] || 'analyze.html';
const PAGE = /^https?:\/\//.test(ARG) ? ARG : 'file://' + path.resolve(ROOT, ARG);   // a file, or a URL (e.g. the Next.js export served by npm run serve)
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/analyze.json'), 'utf8'));
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/cness-advantage.json'), 'utf8'));
const SKIP = new Set(['source', 'captured', 'note', 'rules', 'omitted', 'key', 'id', 'type', 'options']);
const norm = s => String(s).replace(/\s+/g, ' ').trim();
const get = (o, p) => p.split('.').reduce((v, k) => v == null ? v : v[k], o);
function leaves(o, p = '', out = []) {
  if (typeof o === 'string') { out.push(p); return out; }
  if (Array.isArray(o)) { o.forEach((v, i) => leaves(v, p ? `${p}.${i}` : `${i}`, out)); return out; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (SKIP.has(k)) continue; leaves(v, p ? `${p}.${k}` : k, out); }
  return out;
}
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const diffs = []; const bad = m => diffs.push(m);
  await pg.goto(PAGE); await pg.waitForTimeout(400);
  const got = await pg.evaluate(() => {
    const txt = el => { const c = el.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
    return {
      items: [...document.querySelectorAll('[data-k]')].map(e => ({ k: e.dataset.k, text: txt(e), base: e.dataset.labelBase || null, hasStar: !!e.querySelector('.req[aria-hidden="true"]'), href: e.getAttribute('href'), prod: e.getAttribute('data-prod-href') })),
      ph: [...document.querySelectorAll('[data-kp]')].map(e => ({ k: e.dataset.kp, v: e.getAttribute('placeholder') })),
      copy: JSON.parse(document.getElementById('an-copy').textContent),
      preview: [...document.querySelectorAll('[data-preview]')].map(e => e.textContent.replace(/\s+/g, ' ').trim()),
      progress: [...document.querySelectorAll('.panel')].map(p => ({ t: p.dataset.track, pt: p.querySelector('.prog .pt').textContent.replace(/\s+/g, ' ').trim(), pc: p.querySelector('.prog .pc').textContent.replace(/\s+/g, ' ').trim(),
        h3: [...p.querySelectorAll('.pillar h3')].map(h => h.textContent.replace(/\s+/g, ' ').trim()), rg: p.querySelector('.scale').getAttribute('aria-label'), n: +p.dataset.n })),
    };
  });
  const covered = new Set();
  for (const it of got.items) {
    const v = get(INV, it.k);
    if (v === undefined) { bad(`${it.k}: not in inventory`); continue; }
    if (it.k.startsWith('notice.explore')) {     // the link: label and destination per path
      if (it.text.replace(/\s*→$/, '') !== norm(INV.notice.explore.text) && it.text !== norm(INV.notice.explore.text)) bad(`explore label ${it.text}`);
      if (!['organization', 'product'].some(t => it.href === INV.notice.explore[t] && it.prod === INV.notice.explore[t])) bad(`explore link ${it.href}`);
      covered.add('notice.explore.text'); continue;
    }
    if (typeof v !== 'string') { bad(`${it.k}: not a string`); continue; }
    if (it.base != null) { if (`${it.base} *` !== v || !it.hasStar || it.text !== it.base) bad(`${it.k}: label ${JSON.stringify(it.text)} (+hidden *) vs ${JSON.stringify(v)}`); }
    else if (it.text !== norm(v)) bad(`${it.k}: expected ${JSON.stringify(norm(v).slice(0, 90))} got ${JSON.stringify(it.text.slice(0, 90))}`);
    covered.add(it.k);
  }
  const explore = await pg.evaluate(() => [...document.querySelectorAll('.notice a.btn')].map(a => [a.closest('.panel').dataset.track, a.getAttribute('href')]));
  explore.forEach(([t, h]) => { if (h !== INV.notice.explore[t]) bad(`${t}: Explore Certification goes to ${h}`); else covered.add('notice.explore.' + t); });
  for (const p of got.ph) { const v = get(INV, p.k); if (v !== p.v) bad(`${p.k}: placeholder ${JSON.stringify(p.v)} vs ${JSON.stringify(v)}`); covered.add(p.k); }
  // script-only strings, embedded verbatim
  const C = got.copy, same = (a, b, name) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad(`#an-copy ${name} differs from the inventory`); };
  same(C.scorer, INV.scorer, 'scorer'); same(C.validation, INV.validation, 'validation'); same(C.finishFirst, INV.finishFirst, 'finishFirst'); same(C.emailError, INV.emailError, 'emailError');
  for (const t of ['organization', 'product']) { same(C.tracks[t].busy, INV.tracks[t].form.busy, t + ' busy'); same(C.tracks[t].pillars, INV.tracks[t].pillars.map(p => p.name), t + ' pillar names'); covered.add(`tracks.${t}.form.busy`); }
  leaves({ scorer: INV.scorer, validation: INV.validation, finishFirst: INV.finishFirst, emailError: INV.emailError }).forEach(p => covered.add(p));
  // templates as rendered
  for (const p of got.progress) {
    const T = INV.tracks[p.t];
    if (p.pt !== INV.scorer.progress.replace('{n}', '1').replace('{total}', String(p.n))) bad(`${p.t}: progress text ${p.pt}`);
    if (p.pc !== '0' + INV.scorer.completed) bad(`${p.t}: completed text ${p.pc}`);
    p.h3.forEach((h, i) => { if (h !== INV.scorer.pillarTitle.replace('{n}', i + 1).replace('{name}', T.pillars[i].name)) bad(`${p.t}: pillar heading ${h}`); });
    if (p.rg !== INV.scorer.ratingGroup.replace('{name}', T.pillars[0].name)) bad(`${p.t}: rating group label ${p.rg}`);
    if (p.n !== T.pillars.length) bad(`${p.t}: ${p.n} pillars rendered`);
  }
  const all = leaves(INV), missing = all.filter(p => !covered.has(p));
  missing.forEach(p => bad(`not rendered: ${p} = ${JSON.stringify(String(get(INV, p)).slice(0, 80))}`));
  // shared chrome
  const chrome = await pg.evaluate(() => {
    const txt = el => { const c = el.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
    const L = sel => [...document.querySelectorAll(sel)].map(a => [txt(a), a.getAttribute('href'), a.getAttribute('aria-current')]);
    return { nav: L('header .nav a'), sheet: L('#sheet a'), foot: [...document.querySelectorAll('.foot > div:not(.about)')].map(d => [txt(d.querySelector('h3')), [...d.querySelectorAll('li')].map(li => { const a = li.querySelector(':scope > a'); return a ? [txt(a), a.getAttribute('href')] : [txt(li.querySelector('button'))]; })]),
      social: [...document.querySelectorAll('.soc a')].map(a => [a.getAttribute('aria-label'), a.getAttribute('href')]), quick: [...document.querySelectorAll('.qa')].map(a => [txt(a.querySelector('b')), txt(a.querySelector('small')), a.getAttribute('href')]),
      tagline: txt(document.querySelector('.foot .about p')), copyright: txt(document.querySelector('.legal')), noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]') };
  });
  const H = SITE.header, flat = H.nav.flatMap(n => n.menu ? n.menu : [n]);
  if (JSON.stringify(chrome.nav.map(x => [x[0], x[1]])) !== JSON.stringify(flat.map(l => [l.text, l.url]))) bad('header nav labels or destinations differ');
  if (JSON.stringify(chrome.nav.filter(x => x[2] === 'page').map(x => x[0])) !== '["Analyze"]') bad('header: Analyze is not marked as the current page');
  if (JSON.stringify(chrome.sheet.slice(0, flat.length + 1).map(x => [x[0], x[1]])) !== JSON.stringify([[H.mobileOnly[0].text, H.mobileOnly[0].url], ...flat.map(l => [l.text, l.url])])) bad('mobile menu labels or destinations differ');
  const F = SITE.footer;
  if (JSON.stringify(chrome.foot) !== JSON.stringify(F.columns.map(c => [c.title, (c.links || c.items).map(l => l.url ? [l.text, l.url] : [l.text])]))) bad('footer columns differ');
  if (JSON.stringify(chrome.social) !== JSON.stringify(F.social.map(s => [s.text, s.url]))) bad('footer social links differ');
  if (chrome.tagline !== F.tagline || chrome.copyright !== F.copyright) bad('footer text differs');
  if (JSON.stringify(chrome.quick) !== JSON.stringify(SITE.quickActions.map(q => [q.text, q.tag, q.url]))) bad('quick actions differ');
  if (!chrome.noindex) bad('noindex meta missing');
  await b.close();
  console.log(`${got.items.length} tagged elements, ${got.ph.length} placeholders, ${all.length} approved strings, ${missing.length} not rendered.`);
  console.log(`Shared chrome: ${chrome.nav.length} header links, ${chrome.foot.reduce((n, c) => n + c[1].length, 0)} footer items.`);
  console.log(`Not approved copy (preview disclosure, shown only in this preview): ${got.preview.length} block(s):\n  - ` + got.preview.join('\n  - '));
  if (diffs.length) { console.log(`${diffs.length} difference(s):\n` + diffs.slice(0, 60).join('\n')); process.exit(1); }
  console.log('No differences from the approved content.');
})();
