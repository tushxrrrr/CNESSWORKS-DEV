#!/usr/bin/env node
// Global Directory behaviour tests (static page or the Next.js route).
// Usage: node tools/test-directory.js [page URL] [axe.min.js]   (default http://127.0.0.1:8765/directory.html)
// Live image hosts are blocked here: nothing leaves the machine, and cards fall back to their initial as on the live page.
const { chromium, devices } = require('playwright');
const URL_ = process.argv[2] || 'http://127.0.0.1:8765/directory.html', AXE = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const fresh = async (opts = {}) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts }); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) p.errs.push(m.text()); });
    await p.goto(URL_, { waitUntil: 'networkidle' }); await p.waitForSelector('[data-listed] .card'); return p; };
  const st = p => p.evaluate(() => ({ showing: document.querySelector('[data-showing]').textContent.replace(/\s+/g, ' ').trim(), feat: document.querySelectorAll('[data-featured] .card').length,
    list: document.querySelectorAll('[data-listed] .card').length, prov: document.querySelector('[data-prov]').textContent, page: document.querySelector('[data-pager] [aria-current="page"]')?.textContent,
    what: document.querySelector('#f-what .fv').textContent.trim(), where: document.querySelector('#f-where .fv').textContent.trim(), state: JSON.parse(sessionStorage.getItem('cnw-gd-state') || '{}') }));

  let p = await fresh({ reducedMotion: 'reduce' });
  // search console
  await p.click('.console .go'); ok(await p.isVisible('.err') && /Please fill in an industry, service, or location\./.test(await p.textContent('.err')), 'Search with nothing chosen shows the live message');
  await wait(2700); ok(!(await p.isVisible('.err')), 'the message clears after 2.5 seconds');
  await p.click('#f-what'); ok(await p.evaluate(() => document.activeElement.id === 'pin-what') && (await p.getAttribute('#f-what', 'aria-expanded')) === 'true', 'Industry opens its panel with the cursor in the search box');
  ok(/Browse all industries/.test(await p.textContent('#p-what')) && (await p.locator('#p-what .listed').count()) > 0, 'industry list shows with “Listed” marks for industries on the page');
  await p.keyboard.type('Adyar'); ok((await p.locator('#p-what .opt').first().textContent()).trim() === 'Adyar Ananda Bhavan' && /Companies/.test(await p.textContent('#p-what')), 'typing lists matching companies first');
  await p.keyboard.press('Escape'); ok(await p.evaluate(() => document.activeElement.id === 'f-what') && await p.locator('#p-what').isHidden(), 'Escape closes the panel and returns focus to the field');
  await p.click('#f-what'); await p.fill('#pin-what', 'Adyar Ananda Bhavan'); await p.press('#pin-what', 'Enter'); await wait(300);
  let s = await st(p); ok(s.what === 'Adyar Ananda Bhavan' && s.showing === 'Showing 1 to 2 of 2 Entries' && s.prov === 'Directory service results', 'Enter searches: 2 entries, the service’s own answer (' + s.showing + ')');
  await p.click('#f-where'); await p.fill('#pin-where', 'zz'); ok(/No matches found/.test(await p.textContent('#p-where')), 'Location: “No matches found” for an unknown place');
  await p.fill('#pin-where', 'Singa'); await p.press('#pin-where', 'ArrowDown'); ok(await p.evaluate(() => document.activeElement.textContent === 'Singapore'), 'arrow keys move into the location list');
  await p.keyboard.press('Enter'); await wait(300); s = await st(p); ok(s.where === 'Singapore' && s.showing === '' && /Organizations not found/.test(await p.textContent('[data-state]')), 'Industry and Location combine; no match shows the live empty message');
  ok(/Organizations not found/.test(await p.textContent('[data-feat-empty]')), 'featured row shows the listing message when a search finds nothing at all (as live)');
  await p.click('.fld[data-field="where"] .fx'); await p.click('.fld[data-field="what"] .fx'); await wait(200); s = await st(p); ok(s.showing === 'Showing 1 to 24 of 490 Entries' && s.feat === 16, 'clear buttons return to the full directory');
  // focus areas
  await p.click('.fchip[data-focus="Technology"]'); await wait(300); s = await st(p);
  ok(s.what === 'Technology' && s.showing === 'Showing 1 to 24 of 76 Entries' && s.feat === 3 && (await p.getAttribute('.fchip[data-focus="Technology"]', 'aria-pressed')) === 'true', 'focus area searches with its synonyms: 76 entries and 3 featured, as the service answered');
  ok(await p.evaluate(() => Math.abs(document.getElementById('featured-companies-section').getBoundingClientRect().top - (document.getElementById('top').offsetHeight + 16)) < 30), 'and moves to the featured row');
  ok((await p.textContent('[data-lens-n]')).trim() === '76', 'the lens shows the same count');
  // filters (two bars, one selection)
  await p.selectOption('.feat select[data-f="country"]', 'India'); await wait(200); s = await st(p);
  ok(s.showing === 'Showing 1 to 12 of 12 Entries' && (await p.inputValue('.side select[data-f="country"]')) === 'India', 'the featured bar and the listing bar share their selections (Technology + India: 12)');
  await p.check('.side input[data-f="certified"]'); await wait(200); s = await st(p); ok(s.showing === 'Showing 1 to 1 of 1 Entries' && (await p.isChecked('.feat input[data-f="certified"]')), 'Certified only narrows to 1, as the service answered');
  ok(await p.isVisible('.side [data-clear-filters]'), 'Clear appears once a filter is set');
  await p.click('.side [data-clear-filters]'); await wait(200); s = await st(p); ok(s.showing === 'Showing 1 to 24 of 76 Entries' && !(await p.isVisible('.side [data-clear-filters]')), 'Clear resets the filters and keeps the search');
  await p.click('.fld[data-field="what"] .fx'); await wait(200);
  await p.selectOption('.side select[data-f="badge"]', 'Inspired'); await wait(200); s = await st(p); ok(s.showing === 'Showing 1 to 6 of 6 Entries' && /Inspired/.test(await p.textContent('.side label[data-f="badge"] .sv')), 'Badge filter: 6 Inspired, and the control shows the choice');
  await p.selectOption('.side select[data-f="badge"]', 'All');
  // pagination
  await p.click('[data-pager] button[data-go="3"]'); await wait(200); s = await st(p); ok(s.page === '3' && s.showing === 'Showing 49 to 72 of 490 Entries', 'page buttons move through the listing (page 3: 49–72)');
  ok(await p.evaluate(() => Math.abs(document.getElementById('listed-companies-section').getBoundingClientRect().top - (document.getElementById('top').offsetHeight + 16)) < 30), 'a page change brings the listing to the top of the screen');
  await p.fill('#pg-go', '21'); await p.press('#pg-go', 'Enter'); await wait(200); s = await st(p); ok(s.page === '21' && s.showing === 'Showing 481 to 490 of 490 Entries' && await p.isDisabled('[data-pager] button[aria-label="Next page"]'), 'Go to page 21: last 10 entries; Next disabled');
  await p.fill('#pg-go', '99'); await p.press('#pg-go', 'Enter'); await wait(200); ok((await st(p)).page === '21', 'Go to beyond the last page stays on the last page');
  await p.selectOption('.side select[data-f="size"]', 'Micro'); await wait(200); s = await st(p); ok(s.page === undefined && s.showing === 'Showing 1 to 6 of 6 Entries', 'a filter change returns to page 1 (no page buttons for a single page)');
  await p.selectOption('.side select[data-f="size"]', 'All'); await wait(200);
  // featured rail
  const railX = () => p.evaluate(() => document.querySelector('[data-rail]').scrollLeft);
  ok(await p.isDisabled('.arw[data-step="-1"]') && (await p.locator('[data-dots] button').count()) === 6, 'featured: 16 placements in 6 views of three; previous disabled at the start');
  await p.click('.arw[data-step="1"]'); await wait(400); ok((await railX()) > 300 && (await p.getAttribute('[data-dots] button:nth-child(2)', 'aria-current')) === 'true', 'next moves one view and the dots follow');
  await p.click('[data-dots] button:last-child'); await wait(400); ok(await p.isDisabled('.arw[data-step="1"]'), 'last dot reaches the end; next disabled');
  // plan dialog
  await p.click('[data-plan="premium"]'); ok(await p.evaluate(() => document.getElementById('plan-dialog').open && !document.querySelector('[data-plan-card="premium"]').hidden && document.querySelector('[data-plan-card="free"]').hidden), 'Premium opens the plan dialog with the Premium listing');
  ok((await p.getAttribute('[data-explore]', 'href')).endsWith('%2Fcreatetrustprofile%2FGetStarted%3Flisting%3Dpremium'), 'Explore more continues to log in, then the Premium listing (as live for visitors)');
  await p.keyboard.press('Escape'); ok(await p.evaluate(() => !document.getElementById('plan-dialog').open && document.activeElement.dataset.plan === 'premium'), 'Escape closes it and returns focus to Premium');
  // rating popover
  await p.evaluate(() => document.getElementById('listed-companies-section').scrollIntoView()); await p.click('[data-listed] .stars');
  ok(/4\.6 out of 5/.test(await p.textContent('#rpop')) && /5 global ratings/.test(await p.textContent('#rpop')) && /Sign in to rate/.test(await p.textContent('#rpop')), 'stars open the rating summary from the record (4.6 out of 5, 5 global ratings)');
  await p.keyboard.press('Escape'); ok(await p.locator('#rpop').isHidden() && await p.evaluate(() => document.activeElement.classList.contains('stars')), 'Escape closes it and returns focus');
  // FAQ
  await p.focus('#faq-t0'); await p.keyboard.press('ArrowDown'); ok(await p.evaluate(() => document.activeElement.id === 'faq-t1' && !document.getElementById('faq-p1').hidden && document.getElementById('faq-p0').hidden), 'FAQ tabs: arrow keys move and show the panel');
  await p.click('#faq-q1-0'); await p.click('#faq-q1-1'); ok(await p.evaluate(() => document.getElementById('faq-a1-0').hidden && !document.getElementById('faq-a1-1').hidden), 'one answer open at a time');
  // continuity
  await p.click('.fchip[data-focus="Wellness"]'); await p.selectOption('.side select[data-f="size"]', 'Enterprise'); await wait(200); const before = await st(p);
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('[data-listed] .card'); const after = await st(p);
  ok(after.showing === before.showing && after.what === 'Wellness' && (await p.inputValue('.side select[data-f="size"]')) === 'Enterprise', 'search and filters are kept on reload and on return (' + after.showing + ')');
  await p.evaluate(() => scrollTo(0, 2400)); const y0 = await p.evaluate(() => scrollY);
  await p.evaluate(() => { document.addEventListener('click', e => e.preventDefault(), { once: true }); document.querySelector('[data-listed] a.nm').click(); });   // open a profile (navigation held back) from here
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('[data-listed] .card'); await wait(300); ok(Math.abs((await p.evaluate(() => scrollY)) - y0) < 40, 'coming back from a profile returns to the same place');
  ok(!p.errs.length, 'no script errors ' + p.errs.join(' | '));
  await p.context().close();

  // load failure is shown as such, not as an empty directory; Try again recovers
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); let fail1 = true;
    await ctx.route(/data\.json/, r => fail1 ? (fail1 = false, r.abort()) : r.continue()); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    const q = await ctx.newPage(); await q.goto(URL_, { waitUntil: 'networkidle' }); await wait(300);
    ok(/could not be loaded/.test(await q.textContent('[data-state]')) && !(await q.textContent('[data-showing]')) && !/Organizations not found/.test(await q.textContent('[data-state]')), 'a failed load says so (not “not found”)');
    await q.click('[data-retry]'); await q.waitForSelector('[data-listed] .card'); ok(/of 490 Entries/.test(await q.textContent('[data-showing]')), 'Try again loads the directory'); await ctx.close(); }

  // reduced motion: lens static, no entrance animations
  { const q = await fresh({ reducedMotion: 'reduce' }); ok(await q.evaluate(() => document.documentElement.classList.contains('still')), 'reduced motion: page in still mode');
    const a = await q.evaluate(() => document.querySelector('[data-lens="hero"] canvas').toDataURL()); await wait(600); const c = await q.evaluate(() => document.querySelector('[data-lens="hero"] canvas').toDataURL());
    ok(a === c, 'reduced motion: the lens does not move'); await q.context().close(); }
  { const q = await fresh(); const a = await q.evaluate(() => document.querySelector('[data-lens="hero"] canvas').toDataURL()); await wait(800); const c = await q.evaluate(() => document.querySelector('[data-lens="hero"] canvas').toDataURL());
    ok(a !== c, 'with motion: the lens turns slowly'); await q.click('#motionBtn'); await wait(100); const d = await q.evaluate(() => document.querySelector('[data-lens="hero"] canvas').toDataURL()); await wait(600);
    ok(d === await q.evaluate(() => document.querySelector('[data-lens="hero"] canvas').toDataURL()), 'Pause motion stops it'); await q.context().close(); }

  // layout at four widths, phone touch, keyboard order
  for (const w of [1440, 768, 390, 320]) { const q = await fresh({ viewport: { width: w, height: 900 } });
    const r = await q.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, small: [...document.querySelectorAll('.fchip, .sel, .chk, .arw, .pg-btns button, .fld-btn, .console .go, .bm, .stars')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 32).length }));
    ok(r.over <= 0, `${w}px: no sideways scroll`); ok(r.small === 0, `${w}px: controls at least 32px tall (stars and Bookmark 36px, others 44px)`); await q.context().close(); }
  { const ctx = await b.newContext({ ...devices['iPhone 13'] }); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort()); const q = await ctx.newPage(); await q.goto(URL_, { waitUntil: 'networkidle' }); await q.waitForSelector('[data-listed] .card');
    const y = await q.evaluate(() => document.querySelector('.console').getBoundingClientRect().top); ok(y < 844, `phone: the search is on the first screen (at ${Math.round(y)}px)`);
    await q.tap('.fchip[data-focus="Restaurants"]'); await wait(300); ok(/of 9 Entries/.test(await q.textContent('[data-showing]')), 'phone: tapping a focus area searches (9 entries)'); await ctx.close(); }
  { const q = await fresh(); const order = []; for (let i = 0; i < 24; i++) { await q.keyboard.press('Tab'); order.push(await q.evaluate(() => document.activeElement.id || document.activeElement.className || document.activeElement.tagName)); }
    ok(order.includes('f-what') && order.indexOf('f-what') < order.indexOf('f-where') && order.some(c => /fchip/.test(c)), 'keyboard: header, plans, Industry, Location, Search, then focus areas'); await q.context().close(); }

  if (AXE) { const q = await fresh(); await q.addScriptTag({ path: AXE });
    const v = await q.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'], resultTypes: ['violations'] })).violations.map(x => x.id + ' x' + x.nodes.length + ' ' + x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')));
    ok(!v.length, 'axe (WCAG 2.2 AA): ' + (v.join('; ') || 'no violations'));
    await q.click('#f-what'); const v2 = await q.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'], resultTypes: ['violations'] })).violations.map(x => x.id));
    ok(!v2.length, 'axe with the Industry panel open: ' + (v2.join(', ') || 'no violations'));
    await q.keyboard.press('Escape'); await q.click('[data-plan="free"]'); const v3 = await q.evaluate(async () => (await axe.run(document.getElementById('plan-dialog'), { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'], resultTypes: ['violations'] })).violations.map(x => x.id));
    ok(!v3.length, 'axe on the plan dialog: ' + (v3.join(', ') || 'no violations')); await q.context().close(); }

  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
