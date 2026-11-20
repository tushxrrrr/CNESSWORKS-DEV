#!/usr/bin/env node
// Behaviour parity for the CNESS Advantage page: runs the same checks on the approved static page (advantage.html)
// and on another build of it (default: the Next.js export served by `npm run serve`), and compares the results.
// Scroll stops (scene colour, current section dot, page classes, arrivals, level rail, statement words, closing
// daylight), pause / play, SuperApp tap highlight, index jumps, mobile menu, overflow at four widths, load layout
// shift, and (with a path to axe-core) WCAG 2.2 AA. The static page's three.js request is served from node_modules,
// so both pages draw the WebGL field.
// Usage: node tools/test-advantage.js [URL] [axe.min.js]. Exit 1 on any failure.
const { chromium } = require('playwright'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const A = 'file://' + path.join(ROOT, 'advantage.html'), B = process.argv[2] || 'http://localhost:3100/cness-advantage';
const THREE = path.join(ROOT, 'node_modules/three/build/three.module.js');
const AXE = process.argv[3];
const STOPS = ['advantage', 'trust-profile', 'organization-certification', 'aspiring', 'inspired', 'luminary', 'product-certification', 'global-directory', 'plans', 'partners', 'best-practices', 'superapp', 'start'];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
async function run(br, url) {
  const R = { errors: [] };
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', e => R.errors.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()) && R.errors.push(m.text()));
  await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', r => r.fulfill({ path: THREE, contentType: 'application/javascript' }));
  await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  await p.goto(url); await p.waitForTimeout(2500);
  R.cls = +(await p.evaluate(() => window.__cls)).toFixed(4);
  R.anim = await p.evaluate(() => getComputedStyle(document.querySelector('#h-hero .w')).animationName + ' ' + document.querySelectorAll('#h-hero .w').length);
  R.webgl = await p.evaluate(() => !!window.__webgl);
  // scroll through the stops: sky colour (scene), current dot, classes, arrivals, rail, statement words, daylight
  R.stops = [];
  for (const id of STOPS) {
    await p.evaluate(id => scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - 72), id); await p.waitForTimeout(1200);
    await p.evaluate(async () => { let last = '', same = 0; for (let k = 0; k < 40 && same < 3; k++) { await new Promise(r => setTimeout(r, 150)); const c = getComputedStyle(document.querySelector('.sky')).backgroundColor; same = c === last ? same + 1 : 0; last = c; } });   // scene spring at rest
    R.stops.push(await p.evaluate(() => ({
      sky: getComputedStyle(document.querySelector('.sky')).backgroundColor, dot: document.querySelector('#dots a[aria-current]')?.getAttribute('href'),
      cls: ['scrolled', 'day', 'hide-quick'].filter(c => document.documentElement.classList.contains(c)).join(','),
      ins: [...document.querySelectorAll('[data-in]')].map(e => e.style.getPropertyValue('--in')).join('|'),
      rail: document.querySelector('.rail').style.getPropertyValue('--fill'), r: document.querySelector('#start').style.getPropertyValue('--r'),
      says: [...document.querySelectorAll('[data-say] .wd')].map(w => w.style.getPropertyValue('--o')).join('|'), totop: document.querySelector('#totop').hidden })));
  }
  // pause: everything at rest, loop stops
  await p.evaluate(() => scrollTo(0, document.getElementById('aspiring').offsetTop)); await p.waitForTimeout(1500);
  await p.click('#motionBtn'); await p.waitForTimeout(800);
  R.paused = await p.evaluate(async () => {
    await new Promise(r => setTimeout(r, 600));
    return { still: document.documentElement.classList.contains('still'), label: document.querySelector('#motionBtn').getAttribute('aria-label'), rail: document.querySelector('.rail').style.getPropertyValue('--fill'),
      ins: [...document.querySelectorAll('[data-in]')].every(e => e.style.getPropertyValue('--in') === '1.000'), says: [...document.querySelectorAll('[data-say] .wd')].every(w => w.style.getPropertyValue('--o') === '1.000') }; });
  // is the loop asleep while paused? count canvas redraws via rAF wrapper
  R.idleFrames = await p.evaluate(async () => { let n = 0; const raf = window.requestAnimationFrame; window.requestAnimationFrame = f => { n++; return raf(f); }; await new Promise(r => setTimeout(r, 1000)); window.requestAnimationFrame = raf; return n; });
  await p.click('#motionBtn'); await p.waitForTimeout(300);
  R.resumed = await p.evaluate(async () => { let n = 0; const raf = window.requestAnimationFrame; window.requestAnimationFrame = f => { n++; return raf(f); }; await new Promise(r => setTimeout(r, 500)); window.requestAnimationFrame = raf; return n > 5; });
  // way tap highlight (touch) toggles .on
  await p.evaluate(() => document.getElementById('superapp').scrollIntoView()); await p.waitForTimeout(500);
  await p.dispatchEvent('.way[data-way="2"]', 'pointerdown', { pointerType: 'touch' });
  R.way = await p.evaluate(() => [...document.querySelectorAll('.way')].map(w => w.classList.contains('on') ? 1 : 0).join(''));
  // index link jump
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800); await p.click('.idx a[href="#best-practices"]'); await p.waitForTimeout(2500);
  R.jump = await p.evaluate(() => ({ hash: location.hash, top: Math.round(document.getElementById('best-practices').getBoundingClientRect().top), dot: document.querySelector('#dots a[aria-current]')?.getAttribute('href') }));
  // menus and mobile sheet are covered by the shared chrome; quick smoke test at phone width
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400); await p.click('#burger');
  R.sheet = await p.evaluate(() => [!document.getElementById('sheet').hidden, document.getElementById('burger').getAttribute('aria-expanded')].join()); await p.keyboard.press('Escape');
  R.sheetClosed = await p.evaluate(() => document.getElementById('sheet').hidden);
  R.overflow = {}; for (const w of [1440, 768, 390, 320]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300); R.overflow[w] = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); }
  await p.setViewportSize({ width: 1440, height: 900 });
  if (AXE) { await p.addScriptTag({ path: AXE }); R.axe = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => v.id + ' x' + v.nodes.length)); }
  await ctx.close(); return R;
}
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const s = await run(br, A), n = await run(br, B);
  ok(n.errors.length === 0, 'Next: no script errors or hydration warnings ' + n.errors.join(' | '));
  ok(n.webgl && s.webgl, 'WebGL field running on both');
  ok(n.anim === s.anim, `hero words animate the same (${n.anim})`);
  STOPS.forEach((id, i) => { const a = s.stops[i], b = n.stops[i]; const close = (x, y) => typeof x === 'string' && /^[\d.|]+$/.test(x) ? x.split('|').every((v, k) => Math.abs(+v - +(y.split('|')[k] ?? NaN)) <= .01) : x === y;
    const same = Object.keys(a).every(k => close(a[k], b[k]));   // scroll-driven values within 0.01 (each arrival measures itself, so event timing moves the third decimal)
    ok(same, `scroll stop ${id}: scene colour, current dot, page classes, arrivals, rail, statement words, daylight` + (same ? '' : '\n   static ' + JSON.stringify(a).slice(0, 300) + '\n   next   ' + JSON.stringify(b).slice(0, 300))); });
  ok(JSON.stringify(n.paused) === JSON.stringify(s.paused) && n.paused.still && n.paused.ins && n.paused.says, 'pause: same resting state ' + JSON.stringify(n.paused));
  ok(n.idleFrames <= 2, `pause: frame loop sleeps (static ${s.idleFrames}, next ${n.idleFrames} frames in 1 s)`);
  ok(n.resumed && s.resumed, 'play: loop resumes');
  ok(n.way === s.way && n.way === '001000', 'tapping a SuperApp way lights it ' + n.way);
  ok(JSON.stringify(n.jump) === JSON.stringify(s.jump), 'index link jump lands the same ' + JSON.stringify(n.jump));
  ok(n.sheet === 'true,true' && n.sheetClosed, 'mobile sheet opens and closes with Escape');
  ok(Object.values(n.overflow).every(v => v === 0), 'no horizontal overflow ' + JSON.stringify(n.overflow));
  if (AXE) ok(n.axe.length === 0, 'axe (WCAG 2.2 AA): ' + (n.axe.join(', ') || 'no violations') + ` (static: ${s.axe.join(', ') || 'none'})`);
  ok(n.cls <= .02, `load layout shift ${n.cls} (static ${s.cls}; both come from the hero headline when the display font arrives)`);
  console.log(`${pass} passed, ${fail} failed`); await br.close(); process.exit(fail ? 1 : 0);
})();
