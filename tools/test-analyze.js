#!/usr/bin/env node
// Functional tests for the Analyze preview (both paths). Usage: node tools/test-analyze.js [page.html]
// Checks: initial state, rating rules, progress text, back/forward retention, keyboard rating, See result -> form,
// path separation and retention, validation messages and focus (live rules), no network on submit, the preview
// disclosure, the confirmation screen, Analyze Another, reload persistence, layout stability while typing.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const PAGE = 'file://' + path.resolve(ROOT, process.argv[2] || 'analyze.html');
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/analyze.json'), 'utf8')), V = INV.validation;
let pass = 0; const fails = []; const ok = (c, m) => { if (c) pass++; else fails.push(m); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = [], net = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('request', r => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !/fonts\.(googleapis|gstatic)\.com/.test(u)) net.push(r.method() + ' ' + u); });
  await p.goto(PAGE); await p.waitForTimeout(600);
  const O = '#panel-organization', P = '#panel-product';
  const st = sel => p.evaluate(sel => { const q = s => document.querySelector(sel + ' ' + s); return {
      vis: !document.querySelector(sel).hidden, pt: q('.prog .pt').textContent.replace(/\s+/g, ' ').trim(), pc: q('.prog .pc').textContent.replace(/\s+/g, ' ').trim(),
      pillar: [...document.querySelectorAll(sel + ' .pillar')].findIndex(a => !a.hidden), val: q('.readout .val').textContent, next: q('.rate .next').disabled, nextLabel: q('.rate .next .nl').textContent,
      back: !q('.rate .back').hidden, checked: [...document.querySelectorAll(sel + ' .scale [aria-checked="true"]')].map(x => x.dataset.v), form: !q('.details').hidden, notice: !q('.notice').hidden, rate: !q('.rate').hidden,
      group: q('.scale').getAttribute('aria-label'), focus: document.activeElement?.id || document.activeElement?.className || '', rated: [...document.querySelectorAll(sel + ' .route > .wp.rated')].length,
      subj: [...document.querySelectorAll(sel + ' .subj > span')].filter(x => !x.hidden).map(x => x.textContent).join('') }; }, sel);
  // initial
  let s = await st(O);
  ok(s.vis && !(await st(P)).vis, 'Organization path shown first');
  ok(s.pt === 'Pillar 1 of 6' && s.pc === '0% completed', 'initial progress ' + s.pt + ' / ' + s.pc);
  ok(s.val === '—' && s.next && s.checked.length === 0 && !s.back, 'nothing preselected, Next disabled, no Back on pillar 1');
  ok(s.group === 'Rate Conscious Leadership', 'rating group named for the pillar');
  // rate + next + back retention
  await p.click(`${O} .scale [data-v="7"]`); s = await st(O);
  ok(s.val === '7' && !s.next && s.checked.join() === '7', 'rating selects one value and enables Next');
  await p.click(`${O} .scale [data-v="3"]`); s = await st(O); ok(s.checked.join() === '3', 'single value: choosing again replaces');
  await p.click(`${O} .rate .next`); await p.waitForTimeout(100); s = await st(O);
  ok(s.pillar === 1 && s.pt === 'Pillar 2 of 6' && s.pc === '17% completed' && s.back && s.next && s.val === '—', 'pillar 2: progress 17%, fresh rating, Back shown');
  ok(await p.evaluate(() => document.activeElement.id) === 'organization-p2-h', 'focus moves to the new pillar heading');
  ok(s.rated === 1, 'route marks pillar 1 as rated');
  await p.click(`${O} .rate .back`); s = await st(O); ok(s.pillar === 0 && s.val === '3', 'Back keeps the earlier rating');
  await p.click(`${O} .rate .next`); s = await st(O); ok(s.pillar === 1, 'forward again');
  // keyboard on the scale
  await p.focus(`${O} .scale [data-v="1"]`); await p.keyboard.press('ArrowRight'); s = await st(O); ok(s.val === '1', 'arrow key on an unrated scale selects 1');
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); s = await st(O); ok(s.val === '3' && await p.evaluate(() => document.activeElement.dataset.v) === '3', 'arrow keys move the selection and focus');
  await p.keyboard.press('End'); s = await st(O); ok(s.val === '10', 'End selects 10');
  for (const v of [5, 8, 6]) { await p.click(`${O} .rate .next`); await p.click(`${O} .scale [data-v="${v}"]`); }
  await p.click(`${O} .rate .next`); s = await st(O);
  ok(s.pt === 'Pillar 6 of 6' && s.pc === '83% completed' && s.nextLabel === 'See result' && s.next, 'last pillar: 83%, See result, disabled until rated');
  await p.click(`${O} .scale [data-v="4"]`); await p.click(`${O} .rate .next`); await p.waitForTimeout(100); s = await st(O);
  ok(s.form && !s.rate && !s.notice, 'See result opens the details form (no score shown)');
  ok(await p.evaluate(() => document.activeElement.id) === 'organization-form-h', 'focus moves to the form heading');
  ok(await p.evaluate(() => document.querySelectorAll('#panel-organization .route > .wp.rated').length) === 6, 'route shows all six pillars rated');
  // path separation
  await p.click('#tab-product'); await p.waitForTimeout(100); s = await st(P);
  ok(s.vis && !(await st(O)).vis && s.pt === 'Pillar 1 of 7' && s.val === '—' && s.rated === 0, 'Product path starts fresh; Organization ratings not carried over');
  ok(await p.evaluate(() => location.hash) === '#product', 'hash names the path');
  await p.click(`${P} .scale [data-v="9"]`); await p.click('#tab-organization'); s = await st(O); ok(s.form, 'Organization path returns to its form');
  await p.click('#tab-product'); s = await st(P); ok(s.val === '9', 'Product rating kept across path switches');
  await p.click('#tab-organization');
  // validation (organization)
  const submit = async sel => { await p.click(`${sel} .details .submit`); await p.waitForTimeout(80); return p.evaluate(sel => ({ err: document.querySelector(sel + ' .err').hidden ? null : document.querySelector(sel + ' .err').textContent.replace(/\s+/g, ' ').trim(), inv: [...document.querySelectorAll(sel + ' [aria-invalid="true"]')].map(e => e.dataset.key), focus: document.activeElement.dataset.key || document.activeElement.id, dlg: document.getElementById('pvd').open }), sel); };
  let r = await submit(O); ok(r.err === `${V.title} ${V.all}` && r.inv.join() === 'org_name,email' && r.focus === 'org_name', 'empty org form: ' + JSON.stringify(r));
  await p.fill('#an-org-name', 'Preview Org'); await p.fill('#an-email', 'abc'); r = await submit(O); ok(r.err === `${V.title} ${V.email}` && r.focus === 'email', 'bad email: ' + r.err);
  await p.fill('#an-email', 'person@company.com'); await p.fill('#an-website', 'company'); r = await submit(O); ok(r.err === `${V.title} ${V.websiteInvalid}` && r.focus === 'website', 'bad optional website: ' + r.err);
  await p.fill('#an-website', ''); await p.fill('#an-email', 'a@mailinator.com'); r = await submit(O); ok(r.err === `${V.title} ${V.email}`, 'disposable email rejected');
  await p.fill('#an-email', 'a@site.example'); r = await submit(O); ok(r.err === `${V.title} ${V.email}`, 'example TLD rejected');
  await p.fill('#an-email', 'person@company.com');
  // typing does not move the field
  await p.focus('#an-about'); await p.waitForTimeout(400); const y0 = await p.evaluate(() => document.getElementById('an-about').getBoundingClientRect().top); await p.keyboard.type('We make things.'); const y1 = await p.evaluate(() => document.getElementById('an-about').getBoundingClientRect().top);
  ok(Math.abs(y0 - y1) < 1, 'field stays put while typing');
  net.length = 0; r = await submit(O);
  ok(r.err === null && r.dlg, 'valid submit opens the preview disclosure');
  ok(net.length === 0, 'no network request on submit: ' + net.join(', '));
  ok(await p.evaluate(() => document.getElementById('pvd').hasAttribute('data-preview')), 'disclosure marked as preview text');
  await p.click('#pvd [data-close]'); ok(!(await p.evaluate(() => document.getElementById('pvd').open)) && (await st(O)).form, 'Back to the form keeps the form');
  await submit(O); await p.click('#pvd [data-show]'); await p.waitForTimeout(100); s = await st(O);
  const nt = await p.evaluate(() => ({ mail: document.querySelector('#panel-organization .notice .mail').textContent, tag: !!document.querySelector('#panel-organization .notice .pv-tag[data-preview]'), focus: document.activeElement.id }));
  ok(s.notice && nt.mail === 'person@company.com' && nt.tag && nt.focus === 'organization-notice-h', 'confirmation design shows the email and the preview tag');
  // Back from the form (a fresh form): ratings kept
  await p.click('#tab-product'); for (const v of [8, 6, 7, 5, 9, 4]) { await p.click(`${P} .rate .next`); await p.click(`${P} .scale [data-v="${v}"]`); } await p.click(`${P} .rate .next`); s = await st(P); ok(s.form, 'Product: See result opens the product form');
  await p.click(`${P} .details .back-form`); s = await st(P); ok(s.pillar === 6 && s.val === '4' && s.rate, 'Back from the form returns to pillar 7 with its rating');
  await p.click(`${P} .rate .next`);
  r = await submit(P); ok(r.err === `${V.title} ${V.all}` && r.inv.join() === 'org_name,product_name,website,product_description,email', 'empty product form: ' + JSON.stringify(r.inv));
  await p.fill('#an-product-org', 'Acme'); await p.fill('#an-product-about', 'Olive oil'); await p.fill('#an-product-email', 'person@company.com'); await p.fill('#an-product-website', 'https://www.company.com/p');
  r = await submit(P); ok(r.err === `${V.title} ${V.productFields}`, 'missing product name: ' + r.err); await p.keyboard.press('Escape');
  await p.fill('#an-product-name', 'Oil'); await p.fill('#an-product-website', ''); r = await submit(P); ok(r.err === `${V.title} ${V.websiteRequired}`, 'missing website: ' + r.err);
  await p.fill('#an-product-website', 'www.company.com'); r = await submit(P); ok(r.err === `${V.title} ${V.websiteInvalid}`, 'website without https: ' + r.err);
  await p.fill('#an-product-website', 'https://www.company.com'); r = await submit(P); ok(r.dlg, 'valid product submit opens the disclosure'); await p.click('#pvd [data-close]');
  ok((await st(P)).subj === 'Oil', 'product subject shows the product name');
  // Analyze Another resets only this path
  await p.click('#tab-organization'); await p.click(`${O} .notice .again`); s = await st(O);
  ok(s.pillar === 0 && s.val === '—' && s.rated === 0 && await p.evaluate(() => document.getElementById('an-org-name').value) === '', 'Analyze Another starts the Organization path again');
  await p.click(`${O} .scale [data-v="6"]`); await p.waitForTimeout(300);
  // reload persistence
  await p.reload(); await p.waitForTimeout(500); s = await st(O); ok(s.val === '6', 'Organization rating restored after reload');
  await p.click('#tab-product'); s = await st(P); ok(s.form && await p.evaluate(() => document.getElementById('an-product-name').value) === 'Oil', 'Product form and fields restored after reload');
  ok(errs.length === 0, 'no runtime errors: ' + errs.join(' | '));
  await b.close();
  console.log(`${pass} checks passed, ${fails.length} failed.`); if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
})();
