(() => {
  'use strict';
  const root = document.documentElement; root.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  // Graphics are inline SVG/CSS (one set per page). Script only toggles classes and a few CSS variables:
  // arrivals and graphic playback come from IntersectionObservers, scroll work is one rAF per frame,
  // and every animated property is transform or opacity.
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const CW = window.CW = { still: mq.matches, page: null };

  /* ---------- Motion control ---------- */
  const motionBtn = $('#motionBtn');
  const applyStill = () => { root.classList.toggle('still', CW.still); motionBtn.setAttribute('aria-pressed', String(CW.still)); const l = CW.still ? 'Play motion' : 'Pause motion'; motionBtn.setAttribute('aria-label', l); motionBtn.title = l;
    if (CW.still) $$('[data-in], .art, .dawn').forEach(el => el.classList.add('in')); measure(); queue(); };
  motionBtn.addEventListener('click', () => { CW.still = !CW.still; applyStill(); });
  mq.addEventListener?.('change', e => { CW.still = e.matches; applyStill(); });

  /* ---------- Observers: arrivals (once), graphics playing only while on screen, current section ---------- */
  const arrive = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('in'); arrive.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-in], .art, .dawn').forEach(el => arrive.observe(el));
  const onScreen = new Set();
  const playing = new IntersectionObserver(es => es.forEach(e => { e.target.classList.toggle('vis', e.isIntersecting); e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target); }), { rootMargin: '80px 0px' });
  $$('.art, [data-fill]').forEach(el => playing.observe(el));
  const sectionNow = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const dn = $(`.dotnav[data-for="${CW.page}"]`); if (!dn) return;
    $$('a', dn).forEach(a => a.getAttribute('href') === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-scene]').forEach(el => sectionNow.observe(el));

  /* ---------- Router: three pages in one document, addressed by #route or #section ---------- */
  const pages = $$('.pg'), status = $('#route-status'), bar = $('#bar'), totop = $('#totop'), quickEl = $('.quick');
  let cur = null, fills = [], dawn = null;
  const pageOf = id => { const el = id && document.getElementById(id); if (!el) return null; return el.classList.contains('pg') ? el : el.closest('.pg'); };
  function setNavState(pg) {
    const route = pg.id;
    $$('a[data-route]').forEach(a => a.closest('header, .sheet, .switch') && (a.dataset.route === route ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $$('.dotnav').forEach(n => n.hidden = n.dataset.for !== pg.dataset.page);
    document.title = pg.dataset.title + ' | CNESSWORKS';
    root.dataset.pg = pg.dataset.page;
  }
  function show(pg, target, user) {
    if (pg !== cur) {
      const prev = cur; cur = pg; closeMenus();
      const swap = () => {
        pages.forEach(p => { p.hidden = p !== pg; p.classList.remove('leaving'); });
        pg.classList.remove('entering'); if (prev && !CW.still) { void pg.offsetWidth; pg.classList.add('entering'); }
        setNavState(pg); CW.page = pg.dataset.page; fills = $$('[data-fill]', pg); dawn = $('.dawn', pg);
        const t = target && target !== pg ? target : null;
        if (t) t.scrollIntoView({ block: 'start' }); else scrollTo(0, 0);
        if (prev) { const h = $('h1', pg); h && h.focus({ preventScroll: true }); status.textContent = pg.dataset.title; }
        measure(); queue();
      };
      if (prev && !CW.still) { prev.classList.add('leaving'); setTimeout(swap, 170); } else swap();
    } else if (target && target !== pg) target.scrollIntoView({ behavior: CW.still || !user ? 'auto' : 'smooth', block: 'start' });
    else if (user) scrollTo({ top: 0, behavior: CW.still ? 'auto' : 'smooth' });
  }
  const route = (user) => { const id = decodeURIComponent(location.hash.slice(1)); const pg = pageOf(id) || pages[0]; show(pg, id ? document.getElementById(id) : null, user); };
  addEventListener('hashchange', () => route(true));

  /* ---------- One scroll frame: reading progress, step runners, header over daylight ---------- */
  let vh = innerHeight, pending = false, lastY = scrollY, scrolledOn = null, dayOn = null, quickOn = null;
  // track lengths for the step runners (layout reads happen here, on resize and page change only)
  function measure() { vh = innerHeight; for (const f of fills) { const j = f.classList.contains('j7'), vertical = j || innerWidth <= 960;
      f.style.setProperty('--len', Math.max(0, (vertical ? f.clientHeight : f.clientWidth) - (j ? 40 : 44)) + 'px'); f._p = null; } }
  function frame() {
    pending = false;
    const y = scrollY, H = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${H > 0 ? clamp(y / H) : 0})`;
    const sc = y > 8; if (sc !== scrolledOn) { scrolledOn = sc; root.classList.toggle('scrolled', sc); }
    const tt = y < vh; if (totop.hidden !== tt) totop.hidden = tt;
    for (const f of fills) {
      if (!onScreen.has(f) && !CW.still) continue;
      const r = f.getBoundingClientRect(), p = CW.still ? 1 : clamp((vh * .62 - r.top) / Math.max(1, r.height));
      if (f._p === p) continue; f._p = p; f.style.setProperty('--fill', p.toFixed(4)); f.classList.toggle('moving', p > 0 && p < 1);
      const items = $$('[data-stepi]', f), k = Math.min(items.length - 1, Math.floor(p * items.length * .999)); items.forEach((li, j) => li.classList.toggle('on', j <= k && p > 0));
    }
    if (dawn) { const r = dawn.getBoundingClientRect(); const day = r.top < 40 && r.bottom > 80, hq = r.top < vh * .7;
      if (day !== dayOn) { dayOn = day; root.classList.toggle('day', day); } if (hq !== quickOn) { quickOn = hq; root.classList.toggle('hide-quick', hq); } }
  }
  const queue = () => { if (!pending) { pending = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', () => { queue(); const y = scrollY, dy = y - lastY; lastY = y;
    if (dy > 6 && y > 420) root.classList.add('sw-away'); else if (dy < -6 || y < 420) root.classList.remove('sw-away');   // page switcher steps aside while reading down
    if (innerWidth >= 1200 || quickEl.contains(document.activeElement)) root.classList.remove('dock-away');
    else if (dy > 6 && y > 240) root.classList.add('dock-away'); else if (dy < -6 || y < 240) root.classList.remove('dock-away'); }, { passive: true });
  quickEl.addEventListener('focusin', () => root.classList.remove('dock-away'));
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { measure(); queue(); }, 120); });

  /* ---------- Pointer depth: graphics on screen lean toward the pointer (mouse only, coalesced per frame) ---------- */
  let ptr = null, ptrPending = false;
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || CW.still) return; ptr = [e.clientX / innerWidth - .5, e.clientY / innerHeight - .5];
    if (!ptrPending) { ptrPending = true; requestAnimationFrame(() => { ptrPending = false; for (const a of onScreen) if (a.hasAttribute('data-par')) { a.style.setProperty('--px', ptr[0].toFixed(3)); a.style.setProperty('--py', ptr[1].toFixed(3)); } }); } }, { passive: true });

  /* ---------- Header menus and mobile sheet ---------- */
  const dds = $$('.dd');
  function closeMenus() { dds.forEach(d => { if (d.classList.contains('open')) { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); } }); if (!sheet.hidden) setSheet(false); }
  const closeAll = (except) => dds.forEach(d => { if (d !== except && d.classList.contains('open')) { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); } });
  const openDd = (d, focusFirst) => { closeAll(d); d.classList.add('open'); $('button', d).setAttribute('aria-expanded', 'true'); if (focusFirst) ($('.menu a[aria-current]', d) || $('.menu a', d))?.focus(); };
  dds.forEach(d => {
    const b = $('button', d); let t;
    b.addEventListener('click', () => d.classList.contains('open') ? closeAll() : openDd(d));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openDd(d, true); } });
    d.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(t); t = setTimeout(() => openDd(d), 80); });
    d.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; clearTimeout(t); t = setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 220); });
    d.addEventListener('keydown', e => { const links = $$('.menu a', d), k = links.indexOf(document.activeElement);
      if (e.key === 'Escape') { closeAll(); b.focus(); } else if (k >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); links[(k + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus(); } });
    d.addEventListener('focusout', () => setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 0));
    $$('.menu a', d).forEach(a => a.addEventListener('click', () => { closeAll(); }));
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.dd')) closeAll(); });
  const burger = $('#burger'), sheet = $('#sheet');
  function setSheet(open) { sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); root.classList.toggle('sheet-open', open); if (open) ($('a[aria-current]', sheet) || $('a', sheet)).focus(); }
  burger.addEventListener('click', () => setSheet(sheet.hidden));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setSheet(false); });
  $$('.grp > button', sheet).forEach(b => b.addEventListener('click', () => { const s = $('#' + b.getAttribute('aria-controls')), o = s.hidden; s.hidden = !o; b.setAttribute('aria-expanded', String(o)); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });
  matchMedia('(min-width: 1240px)').addEventListener?.('change', e => { if (e.matches) setSheet(false); });

  /* ---------- Shared small interactions ---------- */
  const glow = el => el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  $$('.lcard, .pbtn, .p7 li, .opp6 li').forEach(glow);
  // hover on mouse, focus on keyboard, tap on touch: each list lights its own graphic
  const linkHi = (els, set) => els.forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(el); });
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') set(null); });
    el.addEventListener('focusin', () => set(el)); el.addEventListener('focusout', () => set(null));
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const on = !el.classList.contains('on'); els.forEach(x => x.classList.remove('on')); el.classList.toggle('on', on); set(on ? el : null); }); });
  const attr = (el, v) => v == null ? el && el.removeAttribute('data-on') : el && el.setAttribute('data-on', v);
  // Organization: chips light their column; pillar cards turn the wheel (shortest way round)
  const temple = $$('.temple li'), wheel = $('.wheel'), wrot = wheel && $('.rot', wheel); let wAng = 0;
  linkHi($$('.chip6'), el => temple.forEach((c, k) => c.classList.toggle('on', !!el && k === +el.dataset.col)));
  const turn = k => { if (!wheel) return; attr(wheel, k); if (k == null) return; let t = -30 - 60 * k; while (t - wAng > 180) t -= 360; while (wAng - t > 180) t += 360; wAng = t; wrot.style.setProperty('--rot', t + 'deg'); };
  linkHi($$('.pbtn'), el => turn(el ? +el.dataset.pillar : null));
  // Product: petals, hub
  const bloom = $('.bloom'), hub = $('.hub');
  linkHi($$('.p7 li'), el => attr(bloom, el ? (el.classList.contains('total') ? 'all' : el.dataset.pillar) : null));
  linkHi($$('.opp6 li'), el => attr(hub, el ? el.dataset.way : null));

  $$('[data-copy]').forEach(b => b.addEventListener('click', () => { const done = t => { b.textContent = t; setTimeout(() => b.textContent = 'Copy', 1600); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected'); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(() => done('Copied'), fb); } catch { fb(); } }));
  $$('.pop > button').forEach(b => { const tip = $('#' + b.getAttribute('aria-controls'));
    b.addEventListener('click', () => { const o = tip.hidden; $$('.pop .tip').forEach(t => t.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); tip.hidden = !o; b.setAttribute('aria-expanded', String(o)); }); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop')) { $$('.pop .tip').forEach(t => t.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); } });
  totop.addEventListener('click', () => { scrollTo({ top: 0, behavior: CW.still ? 'auto' : 'smooth' }); $('#top .brand').focus({ preventScroll: true }); });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { if (a.getAttribute('href') === location.hash) { e.preventDefault(); route(true); } }));   // re-selecting the current route or section still moves there

  /* ---------- A. Mother of Certification: region filters, search, show more ---------- */
  (() => {
    const tbl = $('#moc-tbl'); if (!tbl) return;
    const rows = $$('tbody tr:not(.empty)', tbl), empty = $('tr.empty', tbl), more = $('#moc-more'), q = $('#moc-q'), count = $('#moc-count'), btns = $$('.seg button');
    let region = 'All', expanded = false, timer;
    const apply = (animate) => {
      const term = q.value.trim().toLowerCase();
      const match = rows.filter(r => (region === 'All' || r.dataset.r === region) && (!term || r.dataset.q.includes(term)));
      let shown = 0;
      rows.forEach(r => { r.hidden = true; r.classList.remove('in'); });
      match.forEach((r, i) => { const vis = expanded || i < 5; r.hidden = !vis; if (vis) { shown++; if (animate && !CW.still) { r.style.setProperty('--d', Math.min(i, 24)); r.classList.add('in'); } } });
      empty.hidden = match.length > 0;
      more.hidden = match.length <= 5 && !expanded;
      more.textContent = expanded ? more.dataset.less : more.dataset.more; more.setAttribute('aria-expanded', String(expanded));
      clearTimeout(timer); timer = setTimeout(() => { count.textContent = `${shown} of ${match.length}`; }, 350);
    };
    const map = $('.wmap');
    btns.forEach(b => b.addEventListener('click', () => { region = b.dataset.f; map && map.setAttribute('data-region', region); btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); apply(true); }));
    q.addEventListener('input', () => apply(false));
    more.addEventListener('click', () => { expanded = !expanded; apply(expanded); if (!expanded) $('#moc-table').scrollIntoView({ behavior: CW.still ? 'auto' : 'smooth', block: 'start' }); });
    apply(false);
    const fig = $('.fig'); if (fig) { fig.addEventListener('pointermove', e => { if (CW.still || e.pointerType !== 'mouse') return; const r = fig.getBoundingClientRect(); fig.style.setProperty('--tx', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg'); fig.style.setProperty('--ty', -((e.clientY - r.top) / r.height - .5) * 6 + 'deg'); });
      fig.addEventListener('pointerleave', () => { fig.style.setProperty('--tx', '0deg'); fig.style.setProperty('--ty', '0deg'); }); }
  })();

  /* ---------- B. Organization Certification: pillar dialogs, testimonial carousel, FAQ tabs ---------- */
  (() => {
    const dlgs = $$('dialog.pd'); let opener = null;
    const open = (i, from) => { const d = dlgs[(i + dlgs.length) % dlgs.length]; dlgs.forEach(x => x.open && x.close()); if (from) { const r = from.getBoundingClientRect(); d.style.setProperty('--ox', (r.left + r.width / 2) + 'px'); d.style.setProperty('--oy', (r.top + r.height / 2) + 'px'); }
      d.showModal(); turn((i + dlgs.length) % dlgs.length); };
    $$('.pbtn').forEach((b, i) => b.addEventListener('click', () => { opener = b; open(i, b); }));
    $$('.chip6').forEach(b => b.addEventListener('click', () => { opener = b; open(+b.dataset.openPillar, b); }));       // hero chips open the same details
    $$('.wheel .seg').forEach(sg => sg.addEventListener('click', () => { const i = +sg.dataset.i; opener = $$('.pbtn')[i]; open(i, opener); }));
    dlgs.forEach((d, i) => { $$('[data-step]', d).forEach(s => s.addEventListener('click', () => open(i + +s.dataset.step))); $('[data-close]', d).addEventListener('click', () => d.close());
      d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.addEventListener('close', () => { if (!dlgs.some(x => x.open)) { turn(null); opener && opener.focus(); } }); });
    const car = $('.car'); if (car) {
      const slides = $$('.slide', car), ticks = $$('.dots2 i'); let k = 0;
      const go = (n, dir) => { k = (n + slides.length) % slides.length; slides.forEach((s, j) => { s.style.setProperty('--dx', (dir > 0 ? (j === k ? 24 : -24) : (j === k ? -24 : 24)) + 'px'); s.setAttribute('aria-hidden', String(j !== k)); }); ticks.forEach((t, j) => t.classList.toggle('on', j === k)); };
      $$('[data-car]').forEach(b => b.addEventListener('click', () => go(k + +b.dataset.car, +b.dataset.car)));
      let sx = null; car.addEventListener('pointerdown', e => { sx = e.clientX; }); car.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 40) go(k + (e.clientX < sx ? 1 : -1), e.clientX < sx ? 1 : -1); sx = null; });
      car.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(k + 1, 1); if (e.key === 'ArrowLeft') go(k - 1, -1); });
    }
    const tabs = $$('.faq-t [role="tab"]');
    const sel = (t, focus) => { tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; }); if (focus) t.focus(); };
    tabs.forEach((t, i) => { t.addEventListener('click', () => sel(t)); t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (e.key === 'Home') sel(tabs[0], true); if (e.key === 'End') sel(tabs[tabs.length - 1], true); if (d) { e.preventDefault(); sel(tabs[(i + d + tabs.length) % tabs.length], true); } }); });
  })();

  route(false);
  // A direct link to a section: settle the jump again once fonts and images have set the final layout,
  // unless the visitor has already started scrolling.
  // A direct link to a section: settle the jump again once fonts and images have set the final layout,
  // unless the visitor has already started scrolling.
  (() => { const id = decodeURIComponent(location.hash.slice(1)), t = id && document.getElementById(id); if (!t || t.classList.contains('pg')) return;
    let live = true; const stop = () => { live = false; }; ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, stop, { once: true, passive: true }));
    const settle = () => { if (live) t.scrollIntoView({ block: 'start' }); };
    document.fonts?.ready.then(() => requestAnimationFrame(settle)); addEventListener('load', settle, { once: true }); setTimeout(settle, 450); setTimeout(() => { settle(); live = false; }, 1200); })();
  applyStill();
})();
