#!/usr/bin/env node
// Behaviour tests for the Product Certification market deck (tabs, arrows, keyboard, mouse drag with momentum and
// rubber-banding, touch swipe, sideways trackpad scroll, focus, announcements, reduced motion, accessibility).
// Usage: node tools/test-market-deck.js [page] [axe.min.js]
//   page: the static certification.html (default) or the Next.js page, e.g. http://localhost:3100/product-certification
const { chromium, devices } = require('playwright'); const path = require('path');
const ARG = process.argv[2] || 'certification.html', AXE = process.argv[3];
const PAGE = /^https?:/.test(ARG) ? ARG : 'file://' + path.resolve(__dirname, '..', ARG);
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const state = p => p.evaluate(() => { const d = document.querySelector('[data-deck]'); const on = [...d.querySelectorAll('.mslide')].findIndex(s => s.classList.contains('on'));
  return { on, inert: [...d.querySelectorAll('.mslide')].map(s => s.inert), sel: [...d.querySelectorAll('[role=tab]')].map(t => t.getAttribute('aria-selected')),
    tf: d.querySelector('.deck-track').style.transform, W: d.querySelector('.deck-view').clientWidth, prev: d.querySelector('.da[data-step="-1"]').disabled, next: d.querySelector('.da[data-step="1"]').disabled,
    count: d.querySelector('.dc b').textContent, live: d.querySelector('[data-deck-status]').textContent, active: document.activeElement?.id || document.activeElement?.className }; });
const settled = async (p, k) => { await p.waitForTimeout(1300); const s = await state(p); const x = parseFloat(s.tf.match(/\((-?[\d.]+)px/)[1]); return Math.abs(x + k * s.W) < 1; };
(async () => {
  const b = await chromium.launch();
  // desktop: tabs, keyboard, arrows, mouse drag, wheel
  let p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE + '#prd-market'); await p.waitForTimeout(1200);
  let s = await state(p); ok(s.on === 0 && s.prev && !s.next && s.inert.join() === 'false,true,true,true,true', 'starts on slide 1, previous disabled, other slides inert');
  await p.click('#mk-t2'); ok(await settled(p, 2), 'tab click moves the track to slide 3'); s = await state(p); ok(s.sel[2] === 'true' && s.count === '03', 'tab selected and counter updated');
  await p.focus('#mk-t2'); await p.keyboard.press('ArrowRight'); s = await state(p); ok(s.on === 3 && s.active === 'mk-t3', 'ArrowRight selects and focuses the next tab');
  await p.keyboard.press('End'); s = await state(p); ok(s.on === 4 && s.next, 'End goes to the last slide; next disabled');
  await p.keyboard.press('ArrowRight'); s = await state(p); ok(s.on === 0, 'ArrowRight on the last tab wraps to the first');
  await p.keyboard.press('Home'); await p.click('.da[data-step="1"]'); s = await state(p); ok(s.on === 1 && /2 of 5: Speed/.test(s.live), 'next arrow advances and announces "2 of 5: Speed"');
  await p.click('#mk-t3'); await p.waitForTimeout(200); await p.focus('.da[data-step="1"]'); await p.keyboard.press('Enter'); s = await state(p); ok(s.on === 4 && s.next && /da/.test(s.active), 'next arrow at the end hands focus to the previous arrow');
  await p.click('#mk-t1'); await p.waitForTimeout(1300);
  await p.evaluate(() => document.querySelector('.deck').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(300);   // measure with the deck on screen
  const box = await p.locator('.deck-view').boundingBox(); const y = box.y + box.height * .4;
  // slow drag less than half a slide snaps back; fast flick advances one
  await p.mouse.move(box.x + 700, y); await p.mouse.down(); for (let i = 1; i <= 20; i++) { await p.mouse.move(box.x + 700 - i * 10, y); await p.waitForTimeout(16); }
  await p.waitForTimeout(200); await p.mouse.up(); ok(await settled(p, 1), 'slow short drag snaps back to the same slide');
  await p.mouse.move(box.x + 800, y); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(box.x + 800 - i * 30, y); await p.waitForTimeout(16); } await p.mouse.up();
  ok(await settled(p, 2), 'quick flick advances one slide (momentum projection)');
  await p.mouse.move(box.x + 300, y); await p.mouse.down(); for (let i = 1; i <= 30; i++) { await p.mouse.move(box.x + 300 + i * 25, y); await p.waitForTimeout(16); } await p.mouse.up();
  ok(await settled(p, 1), 'long drag never skips more than one slide');
  await p.click('#mk-t0'); await p.waitForTimeout(1300); await p.mouse.move(box.x + 300, y); await p.mouse.down();
  for (let i = 1; i <= 10; i++) { await p.mouse.move(box.x + 300 + i * 30, y); await p.waitForTimeout(16); }
  const rb = await p.evaluate(() => parseFloat(document.querySelector('.deck-track').style.transform.match(/\((-?[\d.]+)px/)[1])); await p.mouse.up();
  ok(rb > 0 && rb < 300 * .8, `rubber-band at the first slide (dragged 300px, moved ${Math.round(rb)}px)`); ok(await settled(p, 0), 'and springs back');
  // a drag that ends on the source link must not open it
  let popups = 0; p.context().on('page', () => popups++);
  const link = await p.locator('#mk-s0 .src a').boundingBox(); await p.mouse.move(link.x + 40, link.y + 5); await p.mouse.down(); for (let i = 1; i <= 5; i++) await p.mouse.move(link.x + 40 - i * 8, link.y + 5); await p.mouse.move(link.x + 40, link.y + 5); await p.mouse.up();
  await p.waitForTimeout(500); ok(popups === 0, 'a drag released over the source link does not follow it');
  // wheel (sideways trackpad)
  await p.mouse.move(box.x + 500, y); await p.mouse.wheel(60, 0); await p.waitForTimeout(100); await p.mouse.wheel(60, 0); s = await state(p); ok(s.on === 1, 'one sideways scroll gesture moves exactly one slide');
  await p.waitForTimeout(700); const before = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 300); await p.waitForTimeout(300); ok((await p.evaluate(() => scrollY)) > before && (await state(p)).on === 1, 'vertical wheel still scrolls the page');
  // charts play only on the current slide
  const play = await p.evaluate(() => [...document.querySelectorAll('.mslide')].map(s => { const m = s.querySelector('.mt i, .cb i, .rise, .grid100 i.on'); return getComputedStyle(m).transform; }));
  ok(play[1] === 'none' && play[0] !== 'none', 'current slide chart has played, others rest');
  // inert: links in other slides are not focusable
  const tabbable = await p.evaluate(() => [...document.querySelectorAll('.mslide a')].filter(a => !a.closest('[inert]')).length); ok(tabbable === 1, 'only the current slide source link is focusable');
  ok(errs.length === 0, 'no script errors ' + errs.join(';'));
  // axe on the product page, deck in view
  if (AXE) {
  await p.addScriptTag({ path: AXE });
  const ax = await p.evaluate(async () => { const r = await axe.run(document.querySelector('#product-certification'), { resultTypes: ['violations'] }); return r.violations.map(v => v.id + ' x' + v.nodes.length + ' ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')); });
  ok(ax.length === 0, 'axe: ' + (ax.join('; ') || 'no violations'));
  }
  await p.close();

  // phone: touch swipe, vertical pan not captured
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); p = await ctx.newPage(); await p.goto(PAGE + '#prd-market'); await p.waitForTimeout(1200);
  const cdp = await ctx.newCDPSession(p); const vb = await p.locator('.deck-view').boundingBox(); const ty = vb.y + 120;
  const swipe = async (x0, y0, dx, dy, n = 8) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / n, y: y0 + dy * i / n }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  await swipe(vb.x + 300, ty, -200, 0); ok(await settled(p, 1), 'touch swipe left moves to slide 2');
  await swipe(vb.x + 100, ty, 200, 0); ok(await settled(p, 0), 'touch swipe right moves back');
  const y0 = await p.evaluate(() => scrollY); await swipe(vb.x + 150, ty + 100, 0, -250); await p.waitForTimeout(600);
  ok((await state(p)).on === 0 && (await p.evaluate(() => scrollY)) > y0, 'vertical swipe scrolls the page and leaves the deck alone');
  await ctx.close();

  // reduced motion: no spring, position set at once
  const rm = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } }); p = await rm.newPage(); await p.goto(PAGE + '#prd-market'); await p.waitForTimeout(800);
  await p.click('#mk-t3'); await p.waitForTimeout(30); s = await state(p); ok(Math.abs(parseFloat(s.tf.match(/\((-?[\d.]+)px/)[1]) + 3 * s.W) < 1, 'reduced motion: track jumps without animation');
  const st = await p.evaluate(() => getComputedStyle(document.querySelector('#mk-s3 .grid100 i.on')).transitionDuration); ok(/^0s/.test(st), 'reduced motion: chart transitions off (' + st + ')');
  await rm.close();
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
