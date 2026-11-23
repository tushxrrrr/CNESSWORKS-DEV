(() => {
  'use strict';
  /* Global Directory. Search, filter and paging rules follow the live page (cnessworks.com/globaldirectory):
     - no search: the listing endpoint with badge, size, industry, country and certified filters; the featured
       row (paid placement) is filtered by the same selections;
     - Industry or Location set: the search endpoint, where the Country filter replaces the typed location;
     - focus areas search for the area with its synonym list; any change returns to page 1 and the first slide;
     - 24 entries a page, ordered by the directory's ranking score (highest first), as every service answer is.
     Data: a snapshot of the service (assets/directory/data.json). Each selection uses the service's own captured
     answer, or the overlap of the captured answers for its parts (checked against the captured combinations);
     only selections with no captured part are matched in the browser, and the status line says so. */
  const root = document.documentElement; root.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const T = JSON.parse($('#gd-strings').textContent);
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const CW = window.CW = { still: mq.matches };
  const main = $('[data-gd]');
  // data-chrome="app": the Next.js route, where components/site/ChromeBehaviour runs the shared chrome and the pause
  // button; this script then only follows the "still" class. data-assets: prefix for asset paths (base path).
  const appChrome = main.dataset.chrome === 'app', AS = main.dataset.assets || '';
  const store = { get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { sessionStorage.removeItem(k); } catch {} } };
  const recent = { get(k) { try { const v = JSON.parse(localStorage.getItem('cnw-recent-' + k) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; } },
    add(k, v) { v = v.trim(); if (!v) return; try { localStorage.setItem('cnw-recent-' + k, JSON.stringify([v, ...recent.get(k).filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, 6))); } catch {} } };
  const cut100 = s => s.slice(0, 100);
  const headOff = () => ($('#top')?.getBoundingClientRect().height || 72) + 16;
  const scrollToId = id => { const el = document.getElementById(id); if (!el) return; scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - headOff()), behavior: CW.still ? 'auto' : 'smooth' }); };

  /* ---------- Motion control and shared chrome (as on the other subpages; on the static page only) ---------- */
  new MutationObserver(() => { const s = root.classList.contains('still'); if (s !== CW.still) { CW.still = s; lenses.forEach(L => L.wake()); } }).observe(root, { attributes: true, attributeFilter: ['class'] });
  let applyStill = () => {};
  if (!appChrome) {
  const motionBtn = $('#motionBtn');
  applyStill = () => { root.classList.toggle('still', CW.still); motionBtn.setAttribute('aria-pressed', String(CW.still)); const l = CW.still ? 'Play motion' : 'Pause motion'; motionBtn.setAttribute('aria-label', l); motionBtn.title = l; lenses.forEach(L => L.wake()); };
  motionBtn.addEventListener('click', () => { CW.still = !CW.still; applyStill(); });
  mq.addEventListener?.('change', e => { CW.still = e.matches; applyStill(); });
  const bar = $('#bar'), totop = $('#totop'), quickEl = $('.quick');
  let pending = false, lastY = scrollY;
  const frame = () => { pending = false; const y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${H > 0 ? clamp(y / H) : 0})`; root.classList.toggle('scrolled', y > 8); const tt = y < innerHeight; if (totop.hidden !== tt) totop.hidden = tt; };
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(frame); } const y = scrollY, dy = y - lastY; lastY = y;
    if (innerWidth >= 1200 || quickEl.contains(document.activeElement)) root.classList.remove('dock-away');
    else if (dy > 6 && y > 240) root.classList.add('dock-away'); else if (dy < -6 || y < 240) root.classList.remove('dock-away'); }, { passive: true });
  quickEl.addEventListener('focusin', () => root.classList.remove('dock-away'));
  const dds = $$('.dd');
  const closeAll = except => dds.forEach(d => { if (d !== except && d.classList.contains('open')) { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); } });
  const openDd = (d, focusFirst) => { closeAll(d); d.classList.add('open'); $('button', d).setAttribute('aria-expanded', 'true'); if (focusFirst) ($('.menu a[aria-current]', d) || $('.menu a', d))?.focus(); };
  dds.forEach(d => { const b = $('button', d); let t;
    b.addEventListener('click', () => d.classList.contains('open') ? closeAll() : openDd(d));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openDd(d, true); } });
    d.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(t); t = setTimeout(() => openDd(d), 80); });
    d.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; clearTimeout(t); t = setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 220); });
    d.addEventListener('keydown', e => { const links = $$('.menu a', d), k = links.indexOf(document.activeElement);
      if (e.key === 'Escape') { closeAll(); b.focus(); } else if (k >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); links[(k + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus(); } });
    d.addEventListener('focusout', () => setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 0)); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.dd')) closeAll(); });
  const burger = $('#burger'), sheet = $('#sheet');
  const setSheet = open => { sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); root.classList.toggle('sheet-open', open); if (open) ($('a[aria-current]', sheet) || $('a', sheet)).focus(); };
  burger.addEventListener('click', () => setSheet(sheet.hidden));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setSheet(false); });
  $$('.grp > button', sheet).forEach(b => b.addEventListener('click', () => { const s = $('#' + b.getAttribute('aria-controls')), o = s.hidden; s.hidden = !o; b.setAttribute('aria-expanded', String(o)); }));
  matchMedia('(min-width: 1240px)').addEventListener?.('change', e => { if (e.matches) setSheet(false); });
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => { const done = t => { b.textContent = t; setTimeout(() => b.textContent = 'Copy', 1600); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected'); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(() => done('Copied'), fb); } catch { fb(); } }));
  $$('.pop > button').forEach(b => { const tip = $('#' + b.getAttribute('aria-controls'));
    b.addEventListener('click', () => { const o = tip.hidden; $$('.pop .tip').forEach(t => t.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); tip.hidden = !o; b.setAttribute('aria-expanded', String(o)); }); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop')) { $$('.pop .tip').forEach(t => t.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); } });
  totop.addEventListener('click', () => { scrollTo({ top: 0, behavior: CW.still ? 'auto' : 'smooth' }); $('#top .brand').focus({ preventScroll: true }); });
  }

  /* ---------- State (kept for the visit: paging, opening a profile and coming back, reloads) ---------- */
  const DEF = { what: null, where: null, badge: 'All', size: 'All', industry: 'All', country: 'All', certified: false, page: 1 };
  const S = Object.assign({}, DEF, store.get('cnw-gd-state', {}));
  const save = () => store.set('cnw-gd-state', S);
  const searching = () => !!(S.what || S.where);
  const expand = w => { const syn = T.focus.synonyms[w]; return syn ? [w, ...syn].join('|') : w; };   // focus areas carry their synonyms, as on the live page

  /* ---------- Data and matching ---------- */
  let D = null, BY = null, ALL = [];
  const key = (kind, q) => kind + '|' + JSON.stringify(Object.entries(q).sort((a, b) => a[0] < b[0] ? -1 : 1));
  const local = {
    badge_type: (r, v) => r.b === v, size: (r, v) => r.z.startsWith(v.toLowerCase()), certified: r => !!r.b, country: (r, v) => r.co === v,
    industry: (r, v) => [r.c, ...r.s].some(x => x.toLowerCase() === v.toLowerCase()),
    what: (r, v) => { const h = [r.n, r.c, ...r.s, r.d].join(' ').toLowerCase(); return v.split('|').map(t => t.trim().toLowerCase()).filter(Boolean).some(t => h.includes(t)); },
    where: (r, v) => [r.co, r.cr, r.cf].join(' ').toLowerCase().includes(v.toLowerCase()) };
  function params() {
    const q = {}, s = searching();
    if (S.what) q.what = expand(S.what);
    const where = S.country !== 'All' ? S.country : (S.where || '');
    if (where) q[s ? 'where' : 'country'] = where;
    if (S.badge !== 'All') q.badge_type = S.badge.toLowerCase();
    if (S.size !== 'All') q.size = S.size;
    if (S.industry !== 'All') q.industry = S.industry;
    if (S.certified) q.certified = 'true';
    return { kind: s ? 'search' : 'listed', q };
  }
  function membership(kind, k, v) {   // a captured service answer for this one selection, else the local rule
    const a = D.answers[key(kind === 'search' && (k === 'what' || k === 'where') ? 'search' : 'listed', { [k]: v })];
    if (a) return { set: new Set([...a.o, ...a.f]), service: true };
    return { set: new Set(ALL.filter(r => local[k](r, v)).map(r => r.x)), service: false };
  }
  function resolve() {
    const { kind, q } = params(), ks = Object.keys(q);
    if (!ks.length) return { featured: ALL.filter(r => r.f), listed: ALL.filter(r => !r.f), service: true };
    const exact = D.answers[key(kind, q)];
    if (exact) return { featured: exact.f.map(x => BY.get(x)), listed: exact.o.map(x => BY.get(x)), service: true };   // the service's own answer, in its order
    let set, service;
    { const parts = ks.map(k => membership(kind, k, q[k])); service = parts.every(p => p.service); set = parts.reduce((acc, p) => acc ? new Set([...acc].filter(x => p.set.has(x))) : p.set, null); }
    const hits = ALL.filter(r => set.has(r.x));   // ALL is in ranking order
    return { featured: hits.filter(r => r.f), listed: hits.filter(r => !r.f), service };
  }

  /* ---------- Images: the live image URL, or in the hosted preview a bundled copy ---------- */
  const imgBase = main.dataset.img || '';
  const chunks = new Map();
  const chunk = c => { if (!chunks.has(c)) chunks.set(c, fetch(imgBase + c + '.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))); return chunks.get(c); };
  function loadImg(box, r) {
    const img = $('img', box);
    const done = ok => { box.classList.remove('loading'); box.classList.toggle('has-img', ok); img.classList.toggle('ok', ok); if (!ok) img.remove(); };
    img.addEventListener('load', () => done(true), { once: true }); img.addEventListener('error', () => done(false), { once: true });
    if (!r.im) return done(false);
    if (!imgBase) { img.src = r.im; return; }
    chunk(r.ic).then(m => m[r.x] ? (img.src = m[r.x]) : done(false));
  }

  /* ---------- Cards ---------- */
  const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
  const BMK = '<svg viewBox="0 0 14 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1 1h12v16l-6-4-6 4V1z"/></svg>';
  const strip = s => (s || '').replace(/\*/g, '').trim();
  function place(r) {   // the live card's location rule (city, state, country; else the region text)
    const full = strip(r.cf || r.cr), parts = [strip(r.co)].filter(Boolean);
    if (parts.length) return [parts.join(', '), full || parts.join(', ')];
    const o = strip(r.cr); return [o, full || o];
  }
  const short = d => d.length <= 158 ? d : d.slice(0, 158) + '…';
  const stars = n => Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
  const ratingText = r => `${r.ra.toFixed(1)} ${T.card.outOf5}, ${r.rc} ${T.card.globalRating}${r.rc === 1 ? '' : 's'}`;
  const profile = r => T.card.profile.replace('{slug}', encodeURIComponent(r.k));
  function card(r, i) {
    const [loc, locFull] = place(r), tier = r.b ? `<span class="tier ${r.b}"><img src="${AS}assets/emblem-${r.b}.svg" width="20" height="20" alt="">${esc(T.card.tiers[r.b])}</span>` : '';
    const when = r.a ? `<time class="when" datetime="${esc(r.a.slice(0, 10))}">${esc(new Date(r.a).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</time>` : '';
    return `<li style="--k:${i}"><article class="card" data-x="${r.x}">
      <div class="media loading"><img alt="" loading="lazy" decoding="async"><span class="ini" aria-hidden="true">${esc((r.n || '?').charAt(0).toUpperCase())}</span>${r.c ? `<span class="ind">${esc(r.c)}</span>` : ''}${tier}</div>
      <div class="cbody"><h3><a class="nm" href="${esc(profile(r))}" data-prod-href="${esc(profile(r))}" target="_blank" rel="noopener" aria-label="${esc(T.card.details.replace('{name}', r.n))}">${esc(r.n)}</a></h3>
        ${r.d ? `<p class="desc">${esc(short(r.d))}</p>` : ''}
        <div class="meta">${when}${loc ? `<span class="loc" title="${esc(locFull)}">${PIN}<span>${esc(loc)}</span></span>` : ''}
          <span class="acts2"><button type="button" class="stars" data-rate="${r.x}" title="${esc(T.card.ratingTitle)}" aria-label="${esc(ratingText(r))}" aria-haspopup="dialog">${stars(Math.round(r.ra))}</button>
          <a class="bm" href="${esc(T.card.login)}" target="_blank" rel="noopener" title="${esc(T.card.bookmarkTitle)}">${esc(T.card.bookmark)}${BMK}</a></span></div></div>
    </article></li>`;
  }
  function fill(ul, rows, animate) {
    ul.innerHTML = rows.map(card).join('');
    $$('.media', ul).forEach((box, i) => loadImg(box, rows[i]));
    ul.classList.remove('swap'); if (animate && !CW.still) { void ul.offsetWidth; ul.classList.add('swap'); }
  }
  const skel = n => Array.from({ length: n }, () => '<li><div class="skel"></div></li>').join('');

  /* ---------- Render ---------- */
  const featUl = $('[data-featured]'), listUl = $('[data-listed]'), rail = $('[data-rail]'), dotsEl = $('[data-dots]'), featEmpty = $('[data-feat-empty]');
  const pager = $('[data-pager]'), showing = $('[data-showing]'), stateEl = $('[data-state]'), prov = $('[data-prov]'), provNote = $('#prov-note'), live = $('#gd-live');
  showing.removeAttribute('aria-live');
  let R = null, prevSig = '', announceT;
  const PER = 24;
  function showingHtml(from, to, total) { return esc(T.pagination.showing).replace('{from}', `<b>${from}</b>`).replace('{to}', `<b>${to}</b>`).replace('{total}', `<b>${total}</b>`); }
  function render(opts = {}) {
    R = resolve();
    const total = R.listed.length, pages = Math.max(1, Math.ceil(total / PER));
    S.page = Math.min(Math.max(1, S.page), pages); save();
    const items = R.listed.slice((S.page - 1) * PER, S.page * PER);
    const sig = JSON.stringify(params()) + '|' + S.page;
    const changed = sig !== prevSig; prevSig = sig;
    // featured (paid placement), filtered by the same selections
    if (changed || opts.force) {
      featUl.classList.add('out'); listUl.classList.add('out');
      const swap = () => { featUl.classList.remove('out'); listUl.classList.remove('out');
        fill(featUl, R.featured, !opts.first); fill(listUl, items, !opts.first); rail.scrollLeft = 0; railState(); };
      opts.first || CW.still ? swap() : setTimeout(swap, 120);
    }
    const bothEmpty = searching() && !R.featured.length && !R.listed.length;
    featEmpty.hidden = R.featured.length > 0; featEmpty.textContent = bothEmpty ? T.listed.empty : T.featured.empty;
    stateEl.hidden = total > 0; stateEl.textContent = T.listed.empty;
    showing.innerHTML = total ? showingHtml((S.page - 1) * PER + 1, Math.min(S.page * PER, total), total) : '';
    prov.hidden = false; prov.classList.toggle('local', !R.service); prov.textContent = R.service ? T.ui.service : T.ui.local; provNote.textContent = R.service ? T.ui.serviceNote : T.ui.localNote;
    renderPager(total, pages);
    syncFilters(items);
    syncSearch();
    lenses.forEach(L => L.update(R, items));
    if (changed && !opts.first) { clearTimeout(announceT); announceT = setTimeout(() => { live.textContent = total ? showing.textContent : T.listed.empty; }, 500); }
  }
  function renderPager(total, pages) {
    pager.hidden = total <= 0; if (total <= 0) { pager.innerHTML = ''; return; }
    const P = T.pagination, p = S.page;
    let s = Math.max(1, p - 2), e = s + 4; if (e > pages) { e = pages; s = Math.max(1, e - 4); }
    const nums = []; for (let k = s; k <= e; k++) nums.push(`<button type="button" data-go="${k}"${k === p ? ' aria-current="page"' : ''}>${k}</button>`);
    pager.innerHTML = (pages > 1 ? `<div class="pg-row"><div class="pg-btns"><button type="button" data-go="${p - 1}" aria-label="${esc(P.prevAria)}"${p <= 1 ? ' disabled' : ''}>${esc(P.previous)}</button>${nums.join('')}<button type="button" data-go="${p + 1}" aria-label="${esc(P.nextAria)}"${p >= pages ? ' disabled' : ''}>${esc(P.next)}</button></div>
      <label class="pg-go"><span>${esc(P.goTo)}</span><input id="pg-go" type="text" inputmode="numeric" pattern="[0-9]*" value="${p}" aria-label="${esc(P.goToAria)}"><span>${esc(P.page)}</span></label></div>` : '');
  }
  function goPage(n) {
    const pages = Math.max(1, Math.ceil(R.listed.length / PER)); n = Math.max(1, Math.min(pages, n | 0));
    if (n === S.page) { const i = $('#pg-go'); if (i) i.value = n; return; }
    S.page = n; render(); scrollToId('listed-companies-section');
  }
  pager.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b && !b.disabled) goPage(+b.dataset.go); });
  pager.addEventListener('keydown', e => { if (e.target.id === 'pg-go' && e.key === 'Enter') { e.preventDefault(); goPage(parseInt(e.target.value.replace(/\D/g, ''), 10) || S.page); } });
  pager.addEventListener('input', e => { if (e.target.id === 'pg-go') e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 4); });
  pager.addEventListener('focusout', e => { if (e.target.id === 'pg-go') { const n = parseInt(e.target.value, 10); Number.isFinite(n) ? goPage(n) : (e.target.value = S.page); } });
  prov.addEventListener('click', () => { const o = provNote.hidden; provNote.hidden = !o; prov.setAttribute('aria-expanded', String(o)); });

  /* Featured rail: native scrolling with snap; arrows move one view, dots show where the view is */
  const arrows = $$('.arw');
  function perView() { const li = $('li', featUl); return li ? Math.max(1, Math.round(rail.clientWidth / (li.getBoundingClientRect().width + 16))) : 3; }
  function railState() {
    const n = R ? R.featured.length : 0, pv = perView(), slides = Math.max(1, Math.ceil(n / pv)), max = rail.scrollWidth - rail.clientWidth;
    const idx = max > 4 ? Math.round((rail.scrollLeft / max) * (slides - 1)) : 0;
    arrows[0].disabled = rail.scrollLeft <= 4; arrows[1].disabled = rail.scrollLeft >= max - 4;
    if (dotsEl.childElementCount !== (n ? slides : 0)) dotsEl.innerHTML = n ? Array.from({ length: slides }, (_, i) => `<button type="button" data-slide="${i}" aria-label="${esc(T.featured.slide.replace('{{n}}', i + 1))}"></button>`).join('') : '';
    $$('button', dotsEl).forEach((b, i) => b.setAttribute('aria-current', String(i === idx)));
  }
  let railRaf = 0; rail.addEventListener('scroll', () => { if (!railRaf) railRaf = requestAnimationFrame(() => { railRaf = 0; railState(); }); }, { passive: true });
  arrows.forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: +b.dataset.step * rail.clientWidth, behavior: CW.still ? 'auto' : 'smooth' })));
  dotsEl.addEventListener('click', e => { const b = e.target.closest('[data-slide]'); if (!b) return; const n = dotsEl.childElementCount, max = rail.scrollWidth - rail.clientWidth;
    rail.scrollTo({ left: n > 1 ? max * (+b.dataset.slide / (n - 1)) : 0, behavior: CW.still ? 'auto' : 'smooth' }); });
  addEventListener('resize', () => R && railState());

  /* ---------- Filters: two bars (featured and listing) share one set of selections ---------- */
  const FILTERS = $$('.filters');
  function setOptions(sel, values, allLabel) {
    const cur = sel.value, want = ['All', ...values];
    if (sel.options.length === want.length && want.every((v, i) => sel.options[i].value === v)) return;
    sel.innerHTML = `<option value="All">${esc(allLabel)}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    sel.value = want.includes(cur) ? cur : 'All';
  }
  function syncFilters(items) {
    // Industry choices: the industries of the listings on screen (featured and this page), as on the live page
    const inds = [...new Set([...R.featured, ...items].map(r => r.c).filter(Boolean))].sort();
    if (S.industry !== 'All' && !inds.includes(S.industry)) inds.push(S.industry);
    const any = S.badge !== 'All' || S.size !== 'All' || S.certified || S.industry !== 'All' || S.country !== 'All';
    FILTERS.forEach(f => {
      setOptions($('select[data-f="industry"]', f), inds, T.filters.industry.all);
      const cs = $('select[data-f="country"]', f); setOptions(cs, D.countries, T.filters.country.all); $('label[data-f="country"]', f).hidden = !D.countries.length;
      for (const [k, ph] of [['badge', T.filters.badge.placeholder], ['size', T.filters.size.placeholder], ['industry', T.filters.industry.placeholder], ['country', T.filters.country.placeholder]]) {
        const sel = $(`select[data-f="${k}"]`, f); sel.value = S[k]; const lab = sel.closest('.sel'), on = S[k] !== 'All';
        lab.classList.toggle('on', on); $('.sv', lab).textContent = on ? sel.options[sel.selectedIndex].text : ph; }
      $('input[data-f="certified"]', f).checked = S.certified;
      $('[data-clear-filters]', f).hidden = !any;
    });
  }
  FILTERS.forEach(f => {
    f.addEventListener('change', e => { const k = e.target.dataset.f; if (!k) return; S[k] = k === 'certified' ? e.target.checked : e.target.value; S.page = 1; render(); });
    $('[data-clear-filters]', f).addEventListener('click', () => { Object.assign(S, { badge: 'All', size: 'All', industry: 'All', country: 'All', certified: false, page: 1 }); render(); });
  });

  /* ---------- Search: Industry and Location panels ---------- */
  const form = $('.console'), err = $('.err', form), FX = s => `<button type="button" class="px" aria-label="${esc(T.search.clear)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  const fields = { what: $('[data-field="what"]'), where: $('[data-field="where"]') };
  let openKey = null;
  function syncSearch() {
    for (const k of ['what', 'where']) { const f = fields[k], v = S[k], fv = $('.fv', f);
      fv.innerHTML = v ? esc(v) : `<span class="ph" data-k="gd:search.${k}.placeholder">${esc(fv.dataset.ph)}</span>`; fv.title = v || ''; $('.fx', f).hidden = !v; f.classList.toggle('has', !!v); }
    $$('.fchip').forEach(b => b.setAttribute('aria-pressed', String(S.what === b.dataset.focus)));
  }
  function setWhat(v) { S.what = v ? cut100(v) : null; S.page = 1; render(); }
  function setWhere(v) { S.where = v ? cut100(v) : null; S.page = 1; render(); }
  function closePanel(focusBack) { if (!openKey) return; const f = fields[openKey]; $('.panel', f).hidden = true; $('.fld-btn', f).setAttribute('aria-expanded', 'false'); if (focusBack) $('.fld-btn', f).focus(); openKey = null; }
  function openPanel(k) {
    closePanel(); openKey = k; const f = fields[k], p = $('.panel', f);
    $('.fld-btn', f).setAttribute('aria-expanded', 'true'); p.hidden = false;
    const P = k === 'what' ? T.search.whatPanel : T.search.wherePanel;
    p.innerHTML = `<div class="pin"><input type="text" id="pin-${k}" maxlength="100" autocomplete="off" placeholder="${esc(P.placeholder)}" aria-label="${esc(T.search[k].label)}">${FX()}</div><p class="plim" hidden>${esc((T.search.whatPanel.maxChars || []).join(''))}</p><div class="plist" role="group"></div>`;
    const input = $('input', p); input.value = k === 'what' ? (S.what || '') : '';
    const draw = () => { $('.plim', p).hidden = input.value.length < 100; $('.px', p).hidden = !input.value; $('.plist', p).innerHTML = k === 'what' ? whatList(input.value) : whereList(input.value); };
    input.addEventListener('input', () => { input.value = cut100(input.value); draw(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); const v = input.value.trim(); if (!v) return;
        if (k === 'what') { const co = companies(v.toLowerCase()).find(n => n.toLowerCase() === v.toLowerCase()); const val = cut100(co || v); recent.add('industry', val); closePanel(true); setWhat(val); scrollToId('listed-companies-section'); }
        else { recent.add('location', v); closePanel(true); setWhere(v); scrollToId('listed-companies-section'); } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); $('.opt', p)?.focus(); } });
    $('.px', p).addEventListener('click', () => { input.value = ''; draw(); input.focus(); });
    p.addEventListener('click', e => { const o = e.target.closest('.opt'); if (!o) return; const v = o.dataset.v;
      if (k === 'what') { recent.add('industry', v); setWhat(v); openPanel('where'); }   // as on the live page, choosing an industry moves on to Location
      else { recent.add('location', v); closePanel(true); setWhere(v); scrollToId('listed-companies-section'); } });
    p.addEventListener('keydown', e => { const opts = $$('.opt', p), i = opts.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closePanel(true); }
      else if (i >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const n = i + (e.key === 'ArrowDown' ? 1 : -1); n < 0 ? input.focus() : opts[Math.min(n, opts.length - 1)].focus(); } });
    draw(); input.focus();
  }
  // Industry panel: recent searches, companies on the current page, and the industry list (as built by the live page)
  const pageItems = () => R ? R.listed.slice((S.page - 1) * PER, S.page * PER) : [];
  const companies = v => pageItems().filter(r => r.n && (r.n.toLowerCase().includes(v) || (r.d || '').toLowerCase().includes(v))).map(r => r.n).slice(0, 8);
  const near = (a, list) => { const x = a.toLowerCase().trim(); return !!x && list.some(y => { y = y.toLowerCase().trim(); return !!y && (y.includes(x) || x.includes(y)); }); };
  function industryRows(q, avail) {
    const L = D.industries, has = n => avail.length > 0 && near(n, avail), byName = (a, b) => a.name.localeCompare(b.name);
    const sortBy = (arr, f) => avail.length ? [...arr].sort((a, b) => f(a) !== f(b) ? (f(a) ? -1 : 1) : byName(a, b)) : [...arr].sort(byName);
    const out = [], v = q.trim().toLowerCase();
    if (!v) {
      const cats = sortBy(L.filter(e => e.level === 1), c => has(c.name) || L.some(e => e.level > 1 && e.category === c.name && has(e.name)));
      const prim = sortBy(L.filter(e => e.level === 2), e => has(e.name));
      for (const c of cats) { const kids = prim.filter(e => e.category === c.name); if (!kids.length) continue; out.push({ type: 'category', e: c }); kids.forEach(e => out.push({ type: 'primary', e, listed: has(e.name) })); }
      return out;
    }
    for (const e of sortBy(L.filter(e => e.level > 1 && (e.name.toLowerCase().includes(v) || e.category.toLowerCase().includes(v) || (e.primaryParent || '').toLowerCase().includes(v))), e => has(e.name)))
      out.push({ type: e.level === 2 ? 'primary' : 'sub', e, listed: has(e.name) });
    return out;
  }
  function whatList(q) {
    const P = T.search.whatPanel, v = q.trim().toLowerCase(), rec = recent.get('industry'), avail = [...new Set(pageItems().map(r => r.c).filter(Boolean))];
    const C = industryRows(q, avail), co = v ? companies(v) : [], short = v.length > 60 ? v.slice(0, 60) + '…' : v;
    const btn = (val, inner, cls = '') => `<button type="button" class="opt ${cls}" data-v="${esc(val)}">${inner}</button>`;
    let h = '';
    if (!v && rec.length) h += `<p class="pg-l">${esc(P.recent)}</p>` + rec.map(x => btn(x, esc(x))).join('');
    if (!v && C.length) h += `<p class="pg-hint">${esc(P.browseHint)}</p>`;
    if (!C.length && !co.length && !v) h += `<p class="pg-msg">${esc(P.unavailable)}</p>`;
    if (!C.length && !co.length && v) h += `<p class="pg-msg">${esc(P.noMatch[0] + short + P.noMatch[1])}</p>` + btn(cut100(v), esc(P.anyway[0] + short + P.anyway[1]), 'anyway');
    if (co.length) h += `<p class="pg-l">${esc(P.companies)}</p>` + co.map(n => btn(n, esc(n))).join('') + (C.length ? `<p class="pg-l">${esc(P.industries)}</p>` : '');
    for (const { type, e, listed } of C) {
      if (type === 'category') { h += `<p class="pg-l">${esc(e.name)}</p>`; continue; }
      h += btn(e.name, `<span>${esc(e.name)}${type === 'sub' ? ` <small>(${esc(e.primaryParent || e.category)})</small>` : ''}</span>${listed ? `<span class="listed">${esc(P.listed)}</span>` : ''}`, type === 'sub' ? 'sub' : '');
    }
    return h;
  }
  function whereList(q) {
    const P = T.search.wherePanel, v = q.trim().toLowerCase(), rec = recent.get('location'), opts = v ? D.countries.filter(c => c.toLowerCase().includes(v)) : D.countries;
    let h = '';
    if (!v && rec.length) h += `<p class="pg-l">${esc(P.recent)}</p>` + rec.map(x => `<button type="button" class="opt" data-v="${esc(x)}">${esc(x)}</button>`).join('');
    if (!opts.length) h += `<p class="pg-msg">${esc(P.noMatches)}</p>`;
    return h + opts.map(c => `<button type="button" class="opt" data-v="${esc(c)}">${esc(c)}</button>`).join('');
  }
  for (const k of ['what', 'where']) {
    const f = fields[k];
    $('.fld-btn', f).addEventListener('click', () => { if (!D) return; openKey === k ? closePanel() : openPanel(k); });
    $('.fx', f).addEventListener('click', () => { k === 'what' ? setWhat(null) : setWhere(null); $('.fld-btn', f).focus(); });
    f.addEventListener('focusout', () => setTimeout(() => { if (openKey === k && !f.contains(document.activeElement)) closePanel(); }, 0));
  }
  document.addEventListener('pointerdown', e => { if (openKey && !e.target.closest('.fld')) closePanel(); });
  let errT;
  form.addEventListener('submit', e => { e.preventDefault();
    if (!S.what && !S.where) { err.hidden = false; clearTimeout(errT); errT = setTimeout(() => err.hidden = true, 2500); return; }
    err.hidden = true; scrollToId('listed-companies-section'); });

  /* Focus areas: search for the area (with its synonyms) and move to the featured row; pointing at one previews its matches in the lens */
  $$('.fchip').forEach(b => {
    b.addEventListener('click', () => { if (!D) return; setWhat(b.dataset.focus); scrollToId('featured-companies-section'); });
    const prev = on => { if (!D) return; const a = on && D.answers[key('search', { what: expand(b.dataset.focus) })]; lenses[0].preview(a ? new Set([...a.o, ...a.f]) : null); };
    b.addEventListener('pointerenter', e => e.pointerType === 'mouse' && prev(true)); b.addEventListener('pointerleave', e => e.pointerType === 'mouse' && prev(false));
    b.addEventListener('focus', () => prev(true)); b.addEventListener('blur', () => prev(false));
  });

  /* ---------- Plan dialog (Free / Premium): what each listing includes; Explore more continues on cnessworks.com ---------- */
  const dlg = $('#plan-dialog'), explore = $('[data-explore]', dlg);
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.plan;
    $$('[data-plan-card]', dlg).forEach(c => c.hidden = c.dataset.planCard !== id); explore.href = T.plans.destinations[id].signedOut;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }));
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  explore.addEventListener('click', () => setTimeout(() => dlg.close(), 0));

  /* ---------- Rating popover ---------- */
  const rpop = $('#rpop'); let rFor = null;
  function closeR() { if (rpop.hidden) return; rpop.hidden = true; rFor?.setAttribute('aria-expanded', 'false'); rFor = null; }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-rate]');
    if (b) { e.preventDefault(); if (rFor === b) return closeR(); closeR(); const r = BY.get(+b.dataset.rate); rFor = b; b.setAttribute('aria-expanded', 'true');
      rpop.innerHTML = `<span class="stars" aria-hidden="true">${stars(Math.round(r.ra))}</span><p><b>${r.ra.toFixed(1)}</b> ${esc(T.card.outOf5)}</p><span>${r.rc} ${esc(T.card.globalRating)}${r.rc === 1 ? '' : 's'}</span><a href="${esc(T.card.login)}" target="_blank" rel="noopener">${esc(T.card.signIn)}</a>`;
      rpop.hidden = false; const br = b.getBoundingClientRect(), w = rpop.offsetWidth;
      rpop.style.top = (br.bottom + scrollY + 8) + 'px'; rpop.style.left = Math.max(8, Math.min(document.documentElement.clientWidth - w - 8, br.right + scrollX - w)) + 'px'; $('a', rpop).focus({ preventScroll: true }); return; }
    if (!e.target.closest('#rpop')) closeR();
  });
  rpop.addEventListener('keydown', e => { if (e.key === 'Escape') { const b = rFor; closeR(); b?.focus(); } });
  rpop.addEventListener('focusout', () => setTimeout(() => { if (!rpop.contains(document.activeElement) && document.activeElement !== rFor) closeR(); }, 0));
  // opening a profile: remember where the visitor was, to come back to the same place
  document.addEventListener('click', e => { if (e.target.closest('a.nm')) store.set('cnw-gd-scroll', scrollY); });

  /* ---------- FAQ: tabs, one answer open at a time ---------- */
  const tabs = $$('.faq-tabs [role="tab"]');
  const selectTab = (t, focus) => { tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
    $$('.qa-q').forEach(q => { q.setAttribute('aria-expanded', 'false'); $('#' + q.getAttribute('aria-controls')).hidden = true; }); if (focus) t.focus(); };
  tabs.forEach((t, i) => { t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => { const n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (n) { e.preventDefault(); selectTab(tabs[(i + n + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); } if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); } }); });
  $$('.qa-q').forEach(q => q.addEventListener('click', () => { const open = q.getAttribute('aria-expanded') === 'true';
    $$('.qa-q', q.closest('.faq-p')).forEach(x => { x.setAttribute('aria-expanded', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
    if (!open) { q.setAttribute('aria-expanded', 'true'); $('#' + q.getAttribute('aria-controls')).hidden = false; } }));

  /* ---------- The discovery lens ---------- */
  // One point per listing, on a sunflower spiral in ranking order (first at the centre). Lit points are the current
  // results; rings mark featured (paid) placement, colours mark certification levels from the records. A change of
  // selection travels outward from the centre once; at rest only a very slow turn remains (none when paused).
  const GOLD = 2.399963229728653, TIER = { aspiring: '#FF8F80', inspired: '#FFC81A', luminary: '#AE92FF' }, REST = .6;   // REST: every listing, nothing selected
  class Lens {
    constructor(fig, mini) {
      this.fig = fig; this.mini = mini; this.cv = $('canvas', fig); this.ctx = this.cv.getContext('2d'); this.tip = $('.lens-tip', fig); this.nEl = $('[data-lens-n]', fig);
      this.pts = []; this.lit = null; this.prevLit = null; this.page = new Set(); this.hot = null; this.rot = 0; this.t0 = 0; this.intro = 0; this.vis = true; this.raf = 0; this.last = 0; this.n = 0; this.nShown = 0; this.hover = -1;
      new ResizeObserver(() => this.size()).observe(fig);
      new IntersectionObserver(es => { this.vis = es[0].isIntersecting; this.wake(); }, { rootMargin: '60px' }).observe(fig);
      this.cv.addEventListener('pointermove', e => this.pick(e)); this.cv.addEventListener('pointerleave', () => this.pick(null));
      this.cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { this.pick(e); clearTimeout(this.tt); this.tt = setTimeout(() => this.pick(null), 2200); } });
    }
    size() { const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); this.w = r.width; this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d); this.ctx.setTransform(d, 0, 0, d, 0, 0); this.wake(); }
    data(all) { const N = all.length; this.pts = all.map((r, i) => ({ r, i, ang: i * GOLD, rad: Math.sqrt((i + .5) / N), l: REST, from: REST, to: REST, t: 0 })); this.index = new Map(all.map((r, i) => [r.x, i])); this.intro = CW.still ? 1 : 0; this.t0 = performance.now(); this.wake(); }
    setLit(set) { const now = performance.now();
      for (const p of this.pts) { const to = set ? (set.has(p.r.x) ? 1 : 0) : REST; if (to !== p.to) { p.from = p.l; p.to = to; p.t = now + (CW.still ? 0 : p.rad * 420); } }
      this.wake(); }
    update(R, items) { const set = new Set([...R.featured, ...R.listed].map(r => r.x)); const all = set.size === this.pts.length;
      this.lit = all ? null : set; if (!this.previewing) this.setLit(this.lit); this.page = new Set(items.map(r => r.x)); this.n = R.listed.length; if (CW.still || !this.vis || !this.nEl) { this.nShown = this.n; if (this.nEl) this.nEl.textContent = this.n; } this.wake(); }
    preview(set) { this.previewing = !!set; this.setLit(set || this.lit); }
    focusCard(x) { this.hot = x != null && this.index.has(x) ? this.index.get(x) : null; this.wake(); }
    wake() { if (!this.raf && this.vis) this.raf = requestAnimationFrame(t => this.draw(t)); }
    pos(p, R0) { const a = p.ang + this.rot, rr = p.rad * R0 * (this.intro < 1 ? clamp(this.intro * 1.6 - p.rad * .6) : 1); return [this.w / 2 + Math.cos(a) * rr, this.w / 2 + Math.sin(a) * rr]; }
    pick(e) { if (!e || !this.pts.length) { this.hover = -1; if (this.tip) this.tip.hidden = true; this.wake(); return; }
      const b = this.cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, R0 = this.w * .44; let best = -1, bd = 14 * 14;
      for (const p of this.pts) { const [px, py] = this.pos(p, R0), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = p.i; } }
      this.hover = best; if (this.tip) { if (best < 0) this.tip.hidden = true; else { const p = this.pts[best], [px, py] = this.pos(p, R0); this.tip.innerHTML = `<b>${esc(p.r.n)}</b>${p.r.c ? `<span>${esc(p.r.c)}</span>` : ''}`; this.tip.style.left = px + 'px'; this.tip.style.top = py + 'px'; this.tip.hidden = false; } }
      this.wake(); }
    draw(now) {
      this.raf = 0; if (!this.vis || !this.w) return;
      const dt = this.last ? Math.min(.05, (now - this.last) / 1000) : 0; this.last = now;
      const c = this.ctx, W = this.w, R0 = W * .44; let busy = false;
      if (this.intro < 1) { this.intro = CW.still ? 1 : clamp((now - this.t0) / 1400); busy = true; }
      if (!CW.still) { this.rot += dt * .012; busy = true; }
      if (this.nEl && this.nShown !== this.n) { const d = this.n - this.nShown; this.nShown = CW.still || Math.abs(d) < 1 ? this.n : this.nShown + d * Math.min(1, dt * 9); this.nEl.textContent = Math.round(this.nShown); busy = true; }
      c.clearRect(0, 0, W, W);
      const base = this.mini ? 1 : 1.25, grow = this.mini ? 1.2 : 1.7;
      for (const p of this.pts) {
        if (p.l !== p.to) { const k = clamp((now - p.t) / 520); const e = 1 - Math.pow(1 - k, 3); p.l = k >= 1 ? p.to : p.from + (p.to - p.from) * e; busy = true; }
        const [x, y] = this.pos(p, R0), L = p.l, r = base + L * grow * (1 - p.rad * .35), tier = p.r.b;
        const lit = clamp((L - REST) / (1 - REST)), a = .14 + L * .86;
        if (lit > 0 && !this.mini) { c.fillStyle = tier ? TIER[tier] : '#FFC81A'; c.globalAlpha = lit * .22; c.beginPath(); c.arc(x, y, r * 3, 0, 6.283); c.fill(); }
        c.globalAlpha = a; c.fillStyle = tier ? TIER[tier] : lit > .5 ? '#FFF1C4' : '#CFC9F2'; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
        if (p.r.f) { c.strokeStyle = '#FFE2A0'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r + 2.2, 0, 6.283); c.stroke(); }
        if (this.mini && this.page.has(p.r.x)) { c.globalAlpha = .9; c.strokeStyle = '#FFC81A'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, r + 2.6, 0, 6.283); c.stroke(); }
      }
      const hot = this.hover >= 0 ? this.hover : this.hot;
      if (hot != null && this.pts[hot]) { const [x, y] = this.pos(this.pts[hot], R0), ph = CW.still ? 0 : (now / 900) % 1;
        c.globalAlpha = 1; c.strokeStyle = '#FFC81A'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 6, 0, 6.283); c.stroke();
        if (!CW.still) { c.globalAlpha = 1 - ph; c.beginPath(); c.arc(x, y, 6 + ph * 12, 0, 6.283); c.stroke(); busy = true; } }
      c.globalAlpha = 1;
      if (busy) this.wake(); else this.last = 0;
    }
  }
  const lenses = $$('[data-lens]').map(f => new Lens(f, f.dataset.lens === 'mini'));
  // the listing's lens follows the card under the pointer or keyboard focus
  const hotCard = e => { const c = e.target.closest?.('.card'); lenses[1]?.focusCard(c && c.closest('[data-listed]') ? +c.dataset.x : null); };
  listUl.addEventListener('pointerover', hotCard); listUl.addEventListener('focusin', hotCard); listUl.addEventListener('pointerleave', () => lenses[1]?.focusCard(null));

  /* ---------- Load ---------- */
  featUl.innerHTML = skel(3); listUl.innerHTML = skel(6);
  function load() {
    stateEl.hidden = true;
    fetch(main.dataset.src).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
      D = d; d.records.forEach((r, i) => r.x = i); ALL = [...d.records].sort((a, b) => b.rf - a.rf); BY = new Map(ALL.map(r => [r.x, r]));
      lenses.forEach(L => L.data(ALL)); render({ first: true });
      const y = store.get('cnw-gd-scroll', null); if (y != null) { store.del('cnw-gd-scroll'); requestAnimationFrame(() => scrollTo({ top: y, behavior: 'instant' })); }
    }).catch(() => {
      featUl.innerHTML = ''; listUl.innerHTML = ''; stateEl.hidden = false;
      stateEl.innerHTML = `<p data-ui>${esc(T.ui.loadError)}</p><button type="button" class="btn ghost" data-ui data-retry>${esc(T.ui.retry)}</button>`;
      $('[data-retry]', stateEl).addEventListener('click', () => { featUl.innerHTML = skel(3); listUl.innerHTML = skel(6); load(); });
    });
  }
  if (appChrome) CW.still = root.classList.contains('still'); else applyStill();
  syncSearch(); load();
})();
