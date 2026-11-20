#!/usr/bin/env node
// Behaviour parity for the Certification pages: runs the same checks on the approved static page (certification.html,
// three pages addressed by #route) and on another build (default: the Next.js export served by `npm run serve`, one
// path per page), and compares the results.
//  - Mother of Certification: region filter, search, Show more / Show less, the map follows the filter.
//  - Organization: pillar dialogs (open, step, close, focus return, wheel), hero chips, testimonial carousel, FAQ tabs.
//  - Product: market deck (tabs, arrows, keyboard, drag), pillar petals.
//  - Scroll: step runners, closing daylight and quick actions; pause button; moving between pages (fade, focus on the
//    new heading, current page in header, menu and switcher, section dots, sky, title); direct links to a section.
//  - Overflow at four widths, load layout shift, and (with a path to axe-core) WCAG 2.2 AA on every page.
// Usage: node tools/test-certification.js [URL] [axe.min.js]. Exit 1 on any failure.
const { chromium } = require('playwright'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const STATIC = 'file://' + path.join(ROOT, 'certification.html'), APP = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, ''), AXE = process.argv[3];
const ROUTES = ['mother-of-certification', 'cness-certification', 'product-certification'];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const urlFor = (app, route, hash = '') => app ? `${APP}/${route}${hash}` : `${STATIC}#${hash ? hash.slice(1) : route}`;

async function run(br, app) {
  const R = { errors: [] };
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', e => R.errors.push(e.message)); p.on('console', m => m.type() === 'error' && R.errors.push(m.text()));
  await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  const go = async (route, hash) => { await p.goto('about:blank'); await p.goto(urlFor(app, route, hash)); await p.waitForTimeout(1200); };   // a fresh load each time, for both builds
  const S = fn => p.evaluate(fn);

  // A. Mother of Certification
  await go(ROUTES[0]); R.cls = [+(await S(() => window.__cls)).toFixed(4)];
  const tbl = () => S(() => ({ shown: [...document.querySelectorAll('#moc-tbl tbody tr:not(.empty)')].filter(r => !r.hidden).length, empty: !document.querySelector('#moc-tbl tr.empty').hidden,
    more: [document.getElementById('moc-more').textContent, document.getElementById('moc-more').hidden, document.getElementById('moc-more').getAttribute('aria-expanded')].join('|'),
    region: document.querySelector('.wmap').dataset.region, pressed: [...document.querySelectorAll('.seg button')].map(b => b.getAttribute('aria-pressed')[0]).join(''), count: document.getElementById('moc-count').textContent }));
  R.moc = [await tbl()];
  await p.click('.seg button[data-f="India"]'); await p.waitForTimeout(500); R.moc.push(await tbl());
  await p.click('.seg button[data-f="All"]'); await p.click('#moc-more'); await p.waitForTimeout(500); R.moc.push(await tbl());
  await p.fill('#moc-q', 'bank'); await p.waitForTimeout(500); R.moc.push(await tbl());
  await p.fill('#moc-q', 'zzzz'); await p.waitForTimeout(500); R.moc.push(await tbl());

  // moving between pages (from Mother of Certification to Organization, by the page switcher)
  await p.fill('#moc-q', ''); await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(300);
  const before = await S(() => location.href);
  await p.click('.switch a[data-route="cness-certification"]');
  await p.waitForTimeout(60); R.leaving = await S(() => !!document.querySelector('.pg.leaving'));
  await p.waitForTimeout(900);
  R.nav = await S(() => ({ path: location.pathname.endsWith('.html') ? location.hash : location.pathname, title: document.title, focus: document.activeElement?.id, top: Math.round(scrollY),
    shown: [...document.querySelectorAll('.pg')].filter(x => !x.hidden).map(x => x.id).join(), entering: !!document.querySelector('.pg.entering'), pg: document.documentElement.dataset.pg,
    current: [...document.querySelectorAll('header a[aria-current], .sheet a[aria-current], .switch a[aria-current]')].map(a => a.dataset.route).join(),
    dots: [...document.querySelectorAll('.dotnav')].filter(n => !n.hidden).map(n => n.dataset.for).join() }));
  await p.goBack(); await p.waitForTimeout(900);
  R.back = await S(() => [...document.querySelectorAll('.pg')].filter(x => !x.hidden).map(x => x.id).join() + '|' + document.documentElement.dataset.pg);
  R.reload = before !== '';

  // B. Organization
  await go(ROUTES[1]); R.cls.push(+(await S(() => window.__cls)).toFixed(4));
  const dlg = () => S(() => ({ open: [...document.querySelectorAll('dialog.pd')].filter(d => d.open).map(d => d.id).join(), wheel: document.querySelector('.wheel').dataset.on ?? '-', focus: document.activeElement?.className }));
  await p.evaluate(() => document.getElementById('org-evaluate').scrollIntoView()); await p.waitForTimeout(400);
  await p.click('.pbtn[data-pillar="2"]'); await p.waitForTimeout(400); R.org = [await dlg()];
  await p.click('#pd-2 [data-step="1"]'); await p.waitForTimeout(400); R.org.push(await dlg());
  await p.keyboard.press('Escape'); await p.waitForTimeout(400); R.org.push(await dlg());
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); await p.click('.chip6[data-col="3"]'); await p.waitForTimeout(400); R.org.push(await dlg());
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('org-spotlight').scrollIntoView()); await p.waitForTimeout(300);
  await p.click('[data-car="1"]'); await p.waitForTimeout(300);
  R.car = await S(() => [...document.querySelectorAll('.car .slide')].map(s => s.getAttribute('aria-hidden')).join() + '|' + [...document.querySelectorAll('.dots2 i')].map(i => i.classList.contains('on') ? 1 : 0).join(''));
  await p.evaluate(() => document.getElementById('org-faq').scrollIntoView()); await p.waitForTimeout(300);
  await p.click('#ft-1'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
  R.faq = await S(() => [...document.querySelectorAll('.faq-t [role=tab]')].map(t => t.getAttribute('aria-selected')[0]).join('') + '|' + [...document.querySelectorAll('.faq-p')].map(x => x.hidden ? 0 : 1).join('') + '|' + document.activeElement.id);
  // step runner and closing daylight, by scroll position
  await p.evaluate(() => { const r = document.getElementById('org-how'); scrollTo(0, r.getBoundingClientRect().top + scrollY - 100); }); await p.waitForTimeout(1200);
  R.fill = await S(() => { const f = document.querySelector('.steps5'); return [f.style.getPropertyValue('--fill'), [...f.querySelectorAll('[data-stepi]')].map(li => li.classList.contains('on') ? 1 : 0).join('')].join('|'); });
  await p.evaluate(() => document.getElementById('org-begin').scrollIntoView()); await p.waitForTimeout(1200);
  R.day = await S(() => ['day', 'hide-quick'].map(c => document.documentElement.classList.contains(c) ? 1 : 0).join(''));
  // pause: everything at rest
  await p.evaluate(() => document.getElementById('org-why').scrollIntoView()); await p.waitForTimeout(300);
  await p.click('#motionBtn'); await p.waitForTimeout(400);
  R.still = await S(() => ({ still: document.documentElement.classList.contains('still'), allIn: [...document.querySelectorAll('.pg:not([hidden]) [data-in], .pg:not([hidden]) .art, .pg:not([hidden]) .dawn')].every(e => e.classList.contains('in')), fill: document.querySelector('.steps5').style.getPropertyValue('--fill') }));
  await p.click('#motionBtn'); await p.waitForTimeout(200);

  // C. Product
  await go(ROUTES[2]); R.cls.push(+(await S(() => window.__cls)).toFixed(4));
  await p.evaluate(() => document.getElementById('prd-market').scrollIntoView()); await p.waitForTimeout(600);
  const deck = () => S(() => { const d = document.querySelector('[data-deck]'); return [[...d.querySelectorAll('.mslide')].findIndex(s => s.classList.contains('on')), d.querySelector('.dc b').textContent, d.querySelector('.deck-track').style.transform, [...d.querySelectorAll('.mslide')].map(s => s.inert ? 1 : 0).join('')].join('|'); });
  await p.click('#mk-t2'); await p.waitForTimeout(1300); R.deck = [await deck()];
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1300); R.deck.push(await deck());
  await p.click('.da[data-step="-1"]'); await p.waitForTimeout(1300); R.deck.push(await deck());
  const vb = await p.locator('.deck-view').boundingBox(), y = vb.y + vb.height * .4;
  await p.mouse.move(vb.x + 800, y); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(vb.x + 800 - i * 30, y); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1300);
  R.deck.push(await deck());
  await p.evaluate(() => document.getElementById('prd-evaluate').scrollIntoView()); await p.waitForTimeout(400);
  await p.hover('.p7 li[data-pillar="4"]'); await p.waitForTimeout(200); R.bloom = await S(() => document.querySelector('.bloom').dataset.on ?? '-');
  await p.hover('.p7 li.total'); await p.waitForTimeout(200); R.bloom += '|' + await S(() => document.querySelector('.bloom').dataset.on ?? '-');

  // direct link to a section of another page
  await go(ROUTES[1], '#org-faq'); await p.waitForTimeout(1500);   // the jump settles once fonts and images are in
  R.deep = await S(() => [document.documentElement.dataset.pg, Math.round(document.getElementById('org-faq').getBoundingClientRect().top)].join('|'));

  // overflow and accessibility on every page
  R.overflow = {}; R.axe = {};
  for (const route of ROUTES) {
    await go(route);
    for (const w of [1440, 768, 390, 320]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(250); R.overflow[`${route.slice(0, 3)}@${w}`] = await S(() => document.documentElement.scrollWidth - innerWidth); }
    await p.setViewportSize({ width: 1440, height: 900 });
    if (AXE) { await p.addScriptTag({ path: AXE }); R.axe[route] = await S(async () => (await axe.run(document.querySelector('.pg:not([hidden])').closest('body'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => v.id + ' x' + v.nodes.length)); }
  }
  await ctx.close(); return R;
}

(async () => {
  const br = await chromium.launch();
  const s = await run(br, false), n = await run(br, true);
  const same = (label, a, b) => ok(JSON.stringify(a) === JSON.stringify(b), `${label}` + (JSON.stringify(a) === JSON.stringify(b) ? '' : `\n   static ${JSON.stringify(a)}\n   app    ${JSON.stringify(b)}`));
  ok(n.errors.length === 0, 'no script errors or hydration warnings ' + n.errors.join(' | '));
  same('Mother: table at rest, region filter, Show more, search, no matches', s.moc, n.moc);
  ok(n.leaving && s.leaving, 'moving to another page fades the current page out first');
  const sn = { ...s.nav, path: s.nav.path.replace('#', '/') };
  same('moving between pages: address, title, focus on the new heading, top of page, fade-in, sky, current page in header/menu/switcher, section dots', sn, n.nav);
  same('Back returns to the previous page', s.back, n.back);
  same('Organization: pillar dialog opens, steps to the next pillar, closes with Escape (focus back, wheel at rest), hero chip opens its pillar', s.org, n.org);
  same('Organization: testimonial carousel', s.car, n.car);
  same('Organization: FAQ tabs (click, arrow keys, panels)', s.faq, n.faq);
  same('step runner fills with scroll', s.fill, n.fill);
  same('closing daylight darkens the header and hides the quick actions', s.day, n.day);
  same('pause: everything at rest', s.still, n.still);
  same('Product: market deck by tab, arrow key, button and drag', s.deck, n.deck);
  same('Product: pillar petals light from the list', s.bloom, n.bloom);
  same('direct link to a section on another page', s.deep, n.deep);
  ok(Object.values(n.overflow).every(v => v === 0), 'no horizontal overflow ' + JSON.stringify(n.overflow));
  ok(n.cls.every(v => v <= .02), `load layout shift ${n.cls.join(', ')} (static ${s.cls.join(', ')})`);
  if (AXE) ok(Object.values(n.axe).every(v => v.length === 0), 'axe (WCAG 2.2 AA) on every page: ' + JSON.stringify(n.axe));
  console.log(`${pass} passed, ${fail} failed`); await br.close(); process.exit(fail ? 1 : 0);
})();
