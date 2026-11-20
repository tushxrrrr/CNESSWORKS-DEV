#!/usr/bin/env node
// Compares the rendered CNESS Advantage page with the locked inventory (content/cness-advantage.json).
// Usage: node tools/verify-advantage.js [page.html | URL]   (default: advantage.html; a URL checks e.g. the Next.js export served by npm run serve). Exit 1 on any difference.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const ARG = process.argv[2] || 'advantage.html';
const PAGE = /^https?:\/\//.test(ARG) ? ARG : 'file://' + path.resolve(ROOT, ARG);
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/cness-advantage.json'), 'utf8'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('https://cdn.jsdelivr.net/**', r => r.abort());
  await p.goto(PAGE); await p.waitForTimeout(600);
  const got = await p.evaluate(() => {
    const txt = el => { const c = el.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
    const main = [...document.querySelectorAll('main [data-c]')].map(e => ({ type: e.dataset.c, text: txt(e), url: e.getAttribute('href') }));
    const links = sel => [...document.querySelectorAll(sel)].map(a => ({ text: txt(a), url: a.getAttribute('href') }));
    return {
      main,
      nav: links('header .nav a'), navBtns: [...document.querySelectorAll('header .nav .dd > button')].map(txt),
      sheet: links('#sheet a'), sheetBtns: [...document.querySelectorAll('#sheet .grp > button')].map(txt),
      region: txt(document.querySelector('.region > button')),
      acts: links('header .right-acts a.login, header .right-acts a.btn'), logo: document.querySelector('header .brand').getAttribute('href'),
      quick: [...document.querySelectorAll('.quick .qa')].map(a => ({ text: txt(a.querySelector('b')), tag: txt(a.querySelector('small')), url: a.getAttribute('href') })),
      foot: {
        tagline: txt(document.querySelector('.foot .about p')), address: txt(document.querySelector('.foot address > span')),
        phones: links('.foot .cp a'), social: [...document.querySelectorAll('.soc a')].map(a => ({ text: a.getAttribute('aria-label'), url: a.getAttribute('href') })),
        cols: [...document.querySelectorAll('.foot > div:not(.about)')].map(d => ({ title: txt(d.querySelector('h3')), items: [...d.querySelectorAll('li')].map(li => { const a = li.querySelector(':scope > a'); return a ? { text: txt(a), url: a.getAttribute('href') } : { text: txt(li.querySelector('button')) }; }) })),
        copyright: txt(document.querySelector('.legal')) },
      ids: [...document.querySelectorAll('[id]')].map(e => e.id), anchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)),
    };
  });
  await b.close();
  const diffs = []; const eq = (where, a, b) => { if (a !== b) diffs.push(`${where}: expected ${JSON.stringify(a)} got ${JSON.stringify(b)}`); };
  // main content, in order
  eq('main item count', INV.main.length, got.main.length);
  INV.main.forEach((it, i) => { const g = got.main[i] || {}; eq(`main[${i}] type`, it.type, g.type); eq(`main[${i}] text`, it.text, g.text); if (it.type === 'a') eq(`main[${i}] url`, it.url, g.url); });
  // header
  const H = INV.header, flat = H.nav.flatMap(n => n.menu ? n.menu : [n]);
  eq('header nav links', JSON.stringify(flat.map(l => [l.text, l.url])), JSON.stringify(got.nav.map(l => [l.text, l.url])));
  eq('header menus', JSON.stringify(H.nav.filter(n => n.menu).map(n => n.text)), JSON.stringify(got.navBtns));
  eq('mobile menu links', JSON.stringify([...H.mobileOnly, ...flat].map(l => [l.text, l.url]).concat(H.region.menu.map(r => [r.code + r.text, 'https://www.cnessworks.com' + r.href])).concat(H.actions.map(l => [l.text, l.url]))), JSON.stringify(got.sheet.map(l => [l.text, l.url])));
  eq('region', H.region.text, got.region); eq('logo', H.logo.url, got.logo);
  eq('header actions', JSON.stringify(H.actions.map(l => [l.text, l.url])), JSON.stringify(got.acts.map(l => [l.text, l.url])));
  eq('quick actions', JSON.stringify(INV.quickActions.map(q => [q.text, q.tag, q.url])), JSON.stringify(got.quick.map(q => [q.text, q.tag, q.url])));
  // footer
  const F = INV.footer, gf = got.foot;
  eq('footer tagline', F.tagline, gf.tagline); eq('footer address', F.address, gf.address); eq('footer copyright', F.copyright, gf.copyright);
  eq('footer phones', JSON.stringify(F.phones.map(l => [l.text, l.href])), JSON.stringify(gf.phones.map(l => [l.text, l.url])));
  eq('footer social', JSON.stringify(F.social.map(l => [l.text, l.url])), JSON.stringify(gf.social.map(l => [l.text, l.url])));
  eq('footer columns', JSON.stringify(F.columns.map(c => [c.title, (c.links || c.items).map(l => l.url ? [l.text, l.url] : [l.text])])), JSON.stringify(gf.cols.map(c => [c.title, c.items.map(l => l.url ? [l.text, l.url] : [l.text])])));
  // structure
  const dup = got.ids.filter((x, i) => got.ids.indexOf(x) !== i); if (dup.length) diffs.push('duplicate ids: ' + dup.join(', '));
  const miss = [...new Set(got.anchors)].filter(a => !got.ids.includes(a)); if (miss.length) diffs.push('anchors without target: ' + miss.join(', '));
  console.log(`Checked ${got.main.length} content items, ${got.nav.length + got.sheet.length} header links, ${gf.cols.reduce((n, c) => n + c.items.length, 0) + gf.phones.length + gf.social.length} footer items, ${got.quick.length} quick actions, ${new Set(got.anchors).size} in-page anchors.`);
  if (diffs.length) { console.log(`${diffs.length} difference(s):\n` + diffs.join('\n')); process.exit(1); }
  console.log('No differences from the approved content.');
})();
