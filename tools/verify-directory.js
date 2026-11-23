#!/usr/bin/env node
// Global Directory: compares the rendered page with the locked inventory and the captured directory data.
//  1. Content: every tagged string (data-k="gd:<path>") against content/global-directory.json; every approved string present.
//  2. Links: plan destinations, sign-up, profile and log-in links, as on the live page.
//  3. Cards: every card on all listing pages and the featured row, against fields computed here from the source records
//     (tools/data/directory-source.json) with the live page's rules: name, industry, description (158 characters),
//     location, award date (only where the record has one), certification level, profile link.
//  4. Service answers: each captured answer (filters, focus areas, searches) replayed through the page:
//     same total, same featured set, same listing order on every page, marked as the service's results.
// Lists separately the elements that exist only in this preview (data-preview) and functional labels (data-ui).
// Usage: node tools/verify-directory.js [page URL]   (default http://127.0.0.1:8765/directory.html; serve the repo root)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const URL_ = process.argv[2] || 'http://127.0.0.1:8765/directory.html';
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/global-directory.json'), 'utf8'));
const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/data/directory-source.json'), 'utf8'));
const norm = s => String(s).replace(/[\s ]+/g, ' ').trim();
const get = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[/^\d+$/.test(k) ? +k : k], o);
const diffs = []; const bad = m => diffs.push(m);

// ---- expected card fields, from the source records with the live page's rules (independent of the page's script)
const POSTAL = /^(?:[A-Z]\d[A-Z]\s?\d[A-Z]\d|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}|\d{5}(?:-\d{4})?)$/i;
const ws = s => s.replace(/[\s  -​﻿]+/g, ' ').trim();
function expect(o) {
  let d = ''; for (const k of ['description', 'conscious_commitment', 'mission_vision', 'mission_statement', 'what_they_stand_for']) { const v = ws(String(o[k] || '').replace(/<[^>]+>/g, ' ')); if (v && !(v.length <= 12 && POSTAL.test(v))) { d = v; break; } }
  const t = (o.badge_type || '').toLowerCase(), tier = t.includes('luminary') ? 'Luminary' : t.includes('inspired') ? 'Inspired' : t.includes('aspiring') ? 'Aspiring' : '';
  const st = s => (s || '').replace(/\*/g, '').trim(); const parts = [st(o.city), st(o.state), st(o.country)].filter(Boolean);
  const loc = parts.length ? parts.join(', ') : st(o.country_region);
  return { name: o.name || '', industry: o.industry || o.industry_sector || '', desc: d.length <= 158 ? d : d.slice(0, 158) + '…', loc, tier,
    date: o.awarded_at ? new Date(o.awarded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
    href: 'https://www.cnessworks.com/directory-detail/' + encodeURIComponent(o.slug || o.id) };
}
const BYID = new Map([...SRC.listed, ...SRC.featured].map(o => [o.id, o]));
const readCards = sel => `[...document.querySelectorAll('${sel} .card')].map(c => ({ name: c.querySelector('h3').textContent.trim(), industry: c.querySelector('.ind')?.textContent.trim() || '',
  desc: c.querySelector('.desc')?.textContent.trim() || '', loc: c.querySelector('.loc span')?.textContent.trim() || '', tier: c.querySelector('.tier')?.textContent.trim() || '',
  date: c.querySelector('.when')?.textContent.trim() || '', href: c.querySelector('a.nm').getAttribute('href'), label: c.querySelector('a.nm').getAttribute('aria-label'), x: +c.dataset.x }))`;

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());   // no request leaves the machine; images are not needed here
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(URL_, { waitUntil: 'networkidle' }); await p.waitForSelector('[data-listed] .card');

  // 1. content
  const tagged = await p.evaluate(() => [...document.querySelectorAll('[data-k^="gd:"]')].map(e => [e.dataset.k.slice(3), e.textContent, e.getAttribute('aria-label')]));
  const seen = new Set();
  for (const [k, text, aria] of tagged) {
    seen.add(k); if (/^plans\.(free|premium)\./.test(k)) continue;   // plan entries are addressed by id; checked below
    let want = get(C, k);
    if (want == null) { bad(`tag ${k}: no such inventory entry`); continue; }
    if (typeof want !== 'string') { bad(`tag ${k}: inventory entry is not a string`); continue; }
    const have = norm(text) || norm(aria || '');
    if (norm(want) !== have && norm(want) !== norm(aria || '')) bad(`text ${k}: "${have}" ≠ "${norm(want)}"`);
  }
  const must = ['hero.h1', 'hero.lede', 'hero.free', 'hero.premium', 'search.what.label', 'search.what.placeholder', 'search.where.label', 'search.where.placeholder', 'search.button', 'search.error',
    'focus.label', ...C.focus.items.map((_, i) => `focus.items.${i}`), ...C.benefits.flatMap((b, i) => [`benefits.${i}.title`, ...b.items.map((_, j) => `benefits.${i}.items.${j}`)]),
    'how.heading', ...C.how.steps.flatMap((_, i) => [`how.steps.${i}.title`, `how.steps.${i}.text`]), 'featured.heading', 'listed.heading', 'filters.certified', 'filters.clear',
    'faq.heading', 'faq.sub', ...C.faq.tabs.flatMap((t, i) => [`faq.tabs.${i}.name`, ...t.items.flatMap((it, j) => [`faq.tabs.${i}.items.${j}.q`, `faq.tabs.${i}.items.${j}.a.lead`, ...it.a.items.map((_, k) => `faq.tabs.${i}.items.${j}.a.items.${k}`)])]),
    'cta.heading', 'cta.text', 'cta.button', 'plans.title', 'plans.lead', 'plans.disclaimer', 'plans.explore', 'plans.premiumBadge', 'plans.premiumSupport',
    ...C.plans.items.flatMap(pl => [`plans.${pl.id}.title`, `plans.${pl.id}.lead`, ...pl.points.map((_, i) => `plans.${pl.id}.points.${i}`), ...pl.features.flatMap((_, i) => [`plans.${pl.id}.features.${i}.0`, `plans.${pl.id}.features.${i}.1`])])];
  // plan entries are addressed by id in the page; map them to the inventory array before comparing
  for (const k of must) { const real = k.replace(/^plans\.(free|premium)\./, (_, id) => `plans.items.${C.plans.items.findIndex(x => x.id === id)}.`);
    if (!seen.has(k) && !seen.has(real)) bad(`missing on page: ${k}`); }
  const planText = await p.evaluate(() => [...document.querySelectorAll('[data-k^="gd:plans.free."], [data-k^="gd:plans.premium."]')].map(e => [e.dataset.k.slice(9), e.textContent]));
  for (const [k, t] of planText) { const [id, ...rest] = k.split('.'); const pl = C.plans.items.find(x => x.id === id); const want = get(pl, rest.join('.')); if (norm(want) !== norm(t)) bad(`plan ${k}: "${norm(t)}" ≠ "${norm(want)}"`); }
  // the search form's name, filter names and options, pagination wording, as approved
  const ui = await p.evaluate(() => ({ form: document.querySelector('.console').getAttribute('aria-label'), sel: [...document.querySelectorAll('.side select')].map(s => [s.dataset.f, s.getAttribute('aria-label'), [...s.options].map(o => o.text)]),
    showing: document.querySelector('[data-showing]').textContent, pager: [...document.querySelectorAll('[data-pager] button')].map(x => x.getAttribute('aria-label') || x.textContent).slice(0, 2), goto: document.querySelector('#pg-go')?.getAttribute('aria-label'),
    pagerLabel: document.querySelector('[data-pager]').getAttribute('aria-label'), arrows: [...document.querySelectorAll('.arw')].map(a => a.getAttribute('aria-label')), dot: document.querySelector('[data-dots] button')?.getAttribute('aria-label') }));
  if (ui.form !== 'Choose what you want to search') bad('search form label ' + ui.form);
  const F = C.filters, wantSel = { badge: [F.badge.placeholder, ['All Badges', ...F.badge.options.map(o => o[1])]], size: [F.size.placeholder, ['All Sizes', ...F.size.options.map(o => o[1])]], country: [F.country.placeholder, [F.country.all, ...SRC.countries]] };
  for (const [f, aria, opts] of ui.sel) { if (wantSel[f] && (aria !== wantSel[f][0] || JSON.stringify(opts) !== JSON.stringify(wantSel[f][1]))) bad(`filter ${f}: ${aria} ${JSON.stringify(opts)}`); if (f === 'industry' && (aria !== F.industry.placeholder || opts[0] !== F.industry.all)) bad('industry filter ' + aria + ' ' + opts[0]); }
  if (norm(ui.showing) !== 'Showing 1 to 24 of 490 Entries') bad('showing ' + ui.showing);
  if (ui.pager[0] !== C.pagination.prevAria || ui.goto !== C.pagination.goToAria || ui.pagerLabel !== C.pagination.navAria) bad('pagination labels ' + JSON.stringify(ui));
  if (ui.arrows[0] !== C.featured.prev || ui.arrows[1] !== C.featured.next || ui.dot !== C.featured.slide.replace('{{n}}', 1)) bad('carousel labels ' + JSON.stringify(ui.arrows) + ui.dot);

  // 2. links
  const links = await p.evaluate(() => ({ cta: document.querySelector('.dawnband a').href, explore: document.querySelector('[data-explore]').getAttribute('href'), bm: document.querySelector('.bm').href, bmTitle: document.querySelector('.bm').title }));
  if (links.cta !== C.cta.url) bad('cta link ' + links.cta);
  if (links.explore !== C.plans.destinations.free.signedOut) bad('explore link ' + links.explore);
  if (links.bm !== C.card.login || links.bmTitle !== C.card.bookmarkTitle) bad('bookmark ' + JSON.stringify(links));
  for (const id of ['free', 'premium']) { await p.click(`[data-plan="${id}"]`); const h = await p.evaluate(() => [document.querySelector('[data-explore]').getAttribute('href'), [...document.querySelectorAll('[data-plan-card]')].filter(c => !c.hidden).map(c => c.dataset.planCard)]);
    if (h[0] !== C.plans.destinations[id].signedOut || h[1].join() !== id) bad(`plan ${id}: ${JSON.stringify(h)}`); await p.keyboard.press('Escape'); }

  // 3. every card: featured row and all listing pages
  const setState = async st => { await p.evaluate(s => sessionStorage.setItem('cnw-gd-state', JSON.stringify(s)), st); await p.reload({ waitUntil: 'networkidle' }); await p.waitForFunction(() => document.querySelector('[data-showing]').textContent || !document.querySelector('[data-state]').hidden); };
  const BASE = { what: null, where: null, badge: 'All', size: 'All', industry: 'All', country: 'All', certified: false, page: 1 };
  const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/directory/data.json'), 'utf8'));
  const idOf = x => DATA.records[x].id;
  let cards = 0;
  const checkCards = (list, where) => list.forEach(c => { const o = BYID.get(idOf(c.x)); if (!o) return bad(`${where}: unknown record`); const e = expect(o); cards++;
    for (const f of ['name', 'industry', 'desc', 'loc', 'tier', 'date', 'href']) if (norm(c[f]) !== norm(e[f])) bad(`${where} ${e.name}: ${f} "${c[f]}" ≠ "${e[f]}"`);
    if (c.label !== `View ${e.name} details`) bad(`${where} ${e.name}: link label ${c.label}`); });
  const feat = await p.evaluate(readCards('[data-featured]'));
  if (JSON.stringify(feat.map(c => idOf(c.x))) !== JSON.stringify(SRC.featured.map(o => o.id))) bad('featured row order differs from the service');
  checkCards(feat, 'featured');
  const listedOrder = [];
  for (let pg = 1; pg <= 21; pg++) { await setState({ ...BASE, page: pg }); const l = await p.evaluate(readCards('[data-listed]')); checkCards(l, `page ${pg}`); listedOrder.push(...l.map(c => idOf(c.x))); }
  if (JSON.stringify(listedOrder) !== JSON.stringify(SRC.listed.map(o => o.id))) bad('listing order (21 pages) differs from the service');

  // 4. captured answers, replayed
  const FOCUS = Object.fromEntries(Object.entries(C.focus.synonyms).map(([k, v]) => [[k, ...v].join('|'), k]));
  let answers = 0;
  for (const [k, a] of Object.entries(SRC.answers)) {
    const q = a.params, st = { ...BASE };
    if (q.what) st.what = FOCUS[q.what] || q.what;
    if (q.where) st.where = q.where;
    if (q.country) st.country = q.country;
    if (q.badge_type) st.badge = q.badge_type[0].toUpperCase() + q.badge_type.slice(1);
    if (q.size) st.size = q.size;
    if (q.industry) st.industry = q.industry;
    if (q.certified) st.certified = true;
    const order = [], pages = Math.max(1, Math.ceil(a.total / 24)); let featIds = null, prov = null, showing = '';
    for (let pg = 1; pg <= pages; pg++) { await setState({ ...st, page: pg });
      const r = await p.evaluate(s => ({ l: eval(s.l), f: eval(s.f), prov: document.querySelector('[data-prov]').textContent, showing: document.querySelector('[data-showing]').textContent }), { l: readCards('[data-listed]'), f: readCards('[data-featured]') });
      order.push(...r.l.map(c => idOf(c.x))); if (pg === 1) { featIds = r.f.map(c => idOf(c.x)); prov = r.prov; showing = r.showing; } }
    answers++;
    if (JSON.stringify(order) !== JSON.stringify(a.organizations)) bad(`answer ${k}: listing differs (${order.length} vs ${a.organizations.length})`);
    if (JSON.stringify(featIds) !== JSON.stringify(a.featured)) bad(`answer ${k}: featured differs`);
    if (prov !== 'Directory service results') bad(`answer ${k}: marked "${prov}"`);
    if (a.total && !norm(showing).endsWith(`of ${a.total} Entries`)) bad(`answer ${k}: "${showing}"`);
  }

  const extra = await p.evaluate(() => ({ preview: [...document.querySelectorAll('[data-preview]')].map(e => e.querySelector('summary b')?.textContent || e.tagName), ui: [...document.querySelectorAll('[data-ui]')].map(e => e.getAttribute('aria-label') || e.textContent.trim()) }));
  await b.close();
  console.log(`Checked ${tagged.length} tagged strings, ${must.length} required strings, ${cards} cards (featured row and all 21 listing pages), ${answers} captured service answers.`);
  console.log(`Preview-only elements: ${extra.preview.join(', ') || 'none'}. Functional labels added: ${extra.ui.join(', ') || 'none'} (plus the load-error message and Try again, shown only if the data cannot load).`);
  if (errors.length) bad('script errors: ' + errors.join(' | '));
  if (diffs.length) { console.log(`${diffs.length} differences:`); diffs.slice(0, 60).forEach(d => console.log('  - ' + d)); process.exit(1); }
  console.log('No differences from the approved content and the captured directory data.');
})();
