(() => {
  'use strict';
  // Analyze: two self-assessment paths (Organization, Product). Each path keeps its own ratings, current
  // pillar, step and form fields (in memory and, where the browser allows it, localStorage), as on the live page.
  // Rules copied from the live page: one rating 1-10 per pillar, nothing preselected, Next disabled until rated,
  // progress = round(index / pillars * 100), See result opens the details form, field validation as live.
  // This preview has no connection to the CNESS service: a valid submit opens a disclosure instead of sending.
  const root = document.documentElement; root.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const COPY = JSON.parse($('#an-copy').textContent);
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let still = mq.matches;
  const statusEl = $('#an-status');
  const say = t => { statusEl.textContent = ''; setTimeout(() => { statusEl.textContent = t; }, 60); };
  const smooth = () => (still ? 'auto' : 'smooth');

  /* ---------- Motion control ---------- */
  const motionBtn = $('#motionBtn');
  const applyStill = () => { root.classList.toggle('still', still); motionBtn.setAttribute('aria-pressed', String(still)); const l = still ? 'Play motion' : 'Pause motion'; motionBtn.setAttribute('aria-label', l); motionBtn.title = l; };
  motionBtn.addEventListener('click', () => { still = !still; applyStill(); });
  mq.addEventListener?.('change', e => { still = e.matches; applyStill(); });

  /* ---------- Validation (same rules as the live page) ---------- */
  const BAD_TLD = new Set(['example', 'test', 'invalid', 'localhost']);
  const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'throwaway.email', '10minutemail.com', 'trashmail.com', 'fakeinbox.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'sharklasers.com']);
  const deliverable = v => { const s = v.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return false; const dom = (s.split('@')[1] || '').toLowerCase(), tld = dom.split('.').pop() || ''; return !(BAD_TLD.has(tld) || DISPOSABLE.has(dom)); };
  const hostOk = h => { const i = h.trim().toLowerCase().replace(/\.$/, ''); if (!i || i.includes('..') || i.includes(' ') || !i.includes('.') || i === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(i)) return false;
    const n = i.split('.'); return n.length >= 2 && /^[a-z]{2,24}$/i.test(n[n.length - 1]) && n.every(p => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(p)); };
  const urlOk = v => { const a = v.trim(); if (!a || !/^https?:\/\//i.test(a)) return false; try { const u = new URL(a); return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password && hostOk(u.hostname); } catch { return false; } };
  const problems = (t, f) => { const p = [];
    if (t === 'organization') { if (!f.org_name.trim()) p.push('org_name'); if (f.website.trim() && !urlOk(f.website)) p.push('website'); if (!deliverable(f.email)) p.push('email'); }
    else { if (!f.org_name.trim()) p.push('org_name'); if (!f.product_name.trim()) p.push('product_name'); if (!urlOk(f.website)) p.push('website'); if (!f.product_description.trim()) p.push('product_description'); if (!deliverable(f.email)) p.push('email'); }
    return p; };
  const message = (n, first, hasEmail, hasSite) => { const V = COPY.validation; if (n <= 0) return null; if (n > 1) return V.all;
    if (first === 'email') return V.email; if (first === 'org_name') return V.orgName; if (first === 'website') return hasSite ? V.websiteInvalid : V.websiteRequired;
    if (first === 'product_name' || first === 'product_description') return V.productFields; return hasEmail ? V.email : V.all; };

  /* ---------- State per path ---------- */
  const TRACKS = ['organization', 'product'];
  const S = {}, U = {};
  const KEY = t => `cness_analyze_preview_v1_${t}`;
  for (const t of TRACKS) {
    const panel = $(`#panel-${t}`), inst = $('.inst', panel), n = +panel.dataset.n;
    U[t] = { panel, inst, route: $('.route', inst), wps: $$('.wp', inst).filter(w => !w.closest('.lens')), legs: $$('.route > .trail .leg', inst), lensLegs: $$('.lens .leg', inst),
      lens: $('.lens', inst), lensIn: $('.lens-in', inst), head: $('.inst-head', inst), steps: $('.steps', inst), pillars: $$('.pillar', inst), rate: $('.rate', inst),
      group: $('.scale', inst), radios: $$('.scale [role="radio"]', inst), mark: $('.scale .mark', inst), val: $('.readout .val', inst), back: $('.rate .back', inst), next: $('.rate .next', inst), nl: $('.rate .next .nl', inst),
      pn: $('.pn', inst), pv: $('.pv', inst), pbar: $('.pbar i', inst), fb: $('.subj .fb', inst), nm: $('.subj .nm', inst),
      form: $('.details', inst), fields: $$('.details [data-key]', inst), err: $('.details .err', inst), submit: $('.details .submit', inst), backForm: $('.details .back-form', inst),
      notice: $('.notice', inst), mail: $('.notice .mail', inst), h1: $(`#h1-${t}`) };
    S[t] = { n, ratings: Array(n).fill(0), index: 0, phase: 'scoring', form: Object.fromEntries(U[t].fields.map(e => [e.dataset.key, ''])), tried: false };
    try {   // restore what this path held last time (live page does the same)
      const v = JSON.parse(localStorage.getItem(KEY(t)) || 'null');
      if (v && v.v === 1 && Array.isArray(v.ratings) && v.ratings.length === n) {
        S[t].ratings = v.ratings.map(x => { x = Math.round(+x); return x >= 1 && x <= 10 ? x : 0; });
        S[t].index = Math.max(0, Math.min(n - 1, +v.index || 0));
        S[t].phase = v.phase === 'form' && S[t].ratings.every(x => x > 0) ? 'form' : 'scoring';
        for (const k in S[t].form) if (typeof v.form?.[k] === 'string') S[t].form[k] = v.form[k];
      }
    } catch {}
    U[t].fields.forEach(e => { e.value = S[t].form[e.dataset.key]; if (e.tagName === 'SELECT' && e.value !== S[t].form[e.dataset.key]) S[t].form[e.dataset.key] = e.value; });
  }
  let saveT = {};
  const save = t => { clearTimeout(saveT[t]); saveT[t] = setTimeout(() => { const s = S[t];
    try { if (s.ratings.some(x => x) || Object.values(s.form).some(x => x)) localStorage.setItem(KEY(t), JSON.stringify({ v: 1, ratings: s.ratings, index: s.index, phase: s.phase === 'notice' ? 'form' : s.phase, form: s.form })); else localStorage.removeItem(KEY(t)); } catch {} }, 150); };

  /* ---------- Route graphic: waypoint states, trail, lens ---------- */
  const geo = {};
  function measure(t) { const r = U[t].route; if (!r || r.offsetParent === null) return false; geo[t] = { w: r.clientWidth, h: r.clientHeight, L: U[t].lens.offsetWidth }; U[t].lensIn.style.width = geo[t].w + 'px'; U[t].lensIn.style.height = geo[t].h + 'px'; return true; }
  function lensTo(t, i, instant) {
    const g = geo[t] || (measure(t) && geo[t]); if (!g) return;
    const w = U[t].wps[i], x = parseFloat(w.style.getPropertyValue('--x')) / 100 * g.w, y = parseFloat(w.style.getPropertyValue('--y')) / 100 * g.h, s = 1.8;
    if (instant) U[t].route.classList.add('snap');
    U[t].lens.style.setProperty('--lx', (x - g.L / 2).toFixed(1) + 'px'); U[t].lens.style.setProperty('--ly', (y - g.L / 2).toFixed(1) + 'px');
    U[t].lensIn.style.setProperty('--ix', (g.L / 2 - x * s).toFixed(1) + 'px'); U[t].lensIn.style.setProperty('--iy', (g.L / 2 - y * s).toFixed(1) + 'px');
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => U[t].route.classList.remove('snap')));
  }
  function drawRoute(t, instant) {
    const s = S[t], u = U[t], at = s.phase === 'scoring' ? s.index : s.n;
    u.wps.forEach((w, i) => {
      if (i < s.n) { w.classList.toggle('rated', s.ratings[i] > 0); w.classList.toggle('cur', s.phase === 'scoring' && i === s.index); }
      else { w.classList.toggle('cur', s.phase === 'form'); w.classList.toggle('done', s.phase === 'notice'); }
    });
    [u.legs, u.lensLegs].forEach(L => L.forEach((l, i) => l.classList.toggle('on', i <= at)));
    lensTo(t, at, instant);
  }

  /* ---------- Render one path ---------- */
  function setMark(t) { const u = U[t], v = S[t].ratings[S[t].index], b = u.radios[v - 1]; u.group.classList.toggle('has', !!v); if (!b) return;
    u.mark.style.setProperty('--mw', b.offsetWidth + 'px'); u.mark.style.setProperty('--mx', b.offsetLeft + 'px'); u.mark.style.setProperty('--my', b.offsetTop + 'px'); }
  // the card heading names what is being analysed once its name is typed (as on the live page), else "Your organization" / "Your product"
  function subject(t) { const f = S[t].form, u = U[t], name = (t === 'product' ? (f.product_name || f.org_name) : f.org_name).trim(); u.nm.textContent = name; u.nm.hidden = !name; u.fb.hidden = !!name; }
  function render(t, o = {}) {
    const s = S[t], u = U[t], scoring = s.phase === 'scoring';
    u.inst.dataset.phase = s.phase;
    u.head.hidden = !scoring; u.steps.hidden = !scoring; u.rate.hidden = !scoring; u.form.hidden = s.phase !== 'form'; u.notice.hidden = s.phase !== 'notice';
    subject(t);
    if (scoring) {
      u.pillars.forEach((a, i) => { const on = i === s.index;
        if (a.hidden === on) { a.hidden = !on; a.classList.remove('in-f', 'in-b'); if (on && o.dir) { void a.offsetWidth; a.classList.add(o.dir > 0 ? 'in-f' : 'in-b'); } } });
      const pct = Math.round(s.index / s.n * 100);
      u.pn.textContent = s.index + 1; u.pv.textContent = pct; u.pbar.style.transform = `scaleX(${pct / 100})`;
      const v = s.ratings[s.index];
      u.group.setAttribute('aria-label', COPY.scorer.ratingGroup.replace('{name}', COPY.tracks[t].pillars[s.index]));
      u.radios.forEach(b => { const on = +b.dataset.v === v; b.setAttribute('aria-checked', String(on)); b.tabIndex = (v ? on : b.dataset.v === '1') ? 0 : -1; });
      const shown = v ? String(v) : COPY.scorer.none;
      if (u.val.textContent !== shown) { u.val.textContent = shown; u.val.classList.remove('pop'); if (o.picked) { void u.val.offsetWidth; u.val.classList.add('pop'); } }
      u.back.hidden = s.index === 0;
      u.nl.textContent = s.index === s.n - 1 ? COPY.scorer.finish : COPY.scorer.next;
      u.next.disabled = !v;
      setMark(t);
    }
    if (s.phase === 'notice') u.mail.textContent = s.form.email.trim();
    drawRoute(t, o.instant);
  }

  /* ---------- Path tabs ---------- */
  const tabs = $$('.paths [role="tab"]'), paths = $('.paths');
  let cur = null;
  function select(t, o = {}) {
    if (!TRACKS.includes(t)) t = 'organization';
    const prev = cur; cur = t;
    tabs.forEach(b => { const on = b.dataset.track === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    paths.dataset.on = t;
    TRACKS.forEach(x => { const p = U[x].panel; p.hidden = x !== t; p.classList.remove('entering'); });
    if (prev && prev !== t && !still) { void U[t].panel.offsetWidth; U[t].panel.classList.add('entering'); }
    measure(t); render(t, { instant: true });
    if (o.focus) $(`#tab-${t}`).focus();
    if (o.hash !== false) try { history.replaceState(null, '', '#' + t); } catch {}
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.track));
    b.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length].dataset.track, { focus: true }); }
      if (e.key === 'Home') { e.preventDefault(); select(tabs[0].dataset.track, { focus: true }); }
      if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1].dataset.track, { focus: true }); } });
  });
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TRACKS.includes(h) && h !== cur) select(h, { hash: false }); });

  /* ---------- Pillar steps ---------- */
  const keepInView = t => { const r = U[t].inst.getBoundingClientRect(), head = 72 + 12; if (r.top < head - 1 || r.top > innerHeight * .5) U[t].inst.scrollIntoView({ behavior: smooth(), block: 'start' }); };
  const focusPillar = t => { const h = $('h3', U[t].pillars[S[t].index]); h && h.focus({ preventScroll: true }); };
  for (const t of TRACKS) {
    const u = U[t];
    u.radios.forEach(b => b.addEventListener('click', () => { const s = S[t]; s.ratings[s.index] = +b.dataset.v; save(t); render(t, { picked: true }); }));
    u.group.addEventListener('keydown', e => { const s = S[t], v = s.ratings[s.index] || 0;
      let nv = null; if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nv = v ? Math.min(10, v + 1) : 1; if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nv = v ? Math.max(1, v - 1) : 1;
      if (e.key === 'Home') nv = 1; if (e.key === 'End') nv = 10;
      if (nv == null) return; e.preventDefault(); s.ratings[s.index] = nv; save(t); render(t, { picked: true }); u.radios[nv - 1].focus(); });
    u.next.addEventListener('click', () => { const s = S[t]; if (!s.ratings[s.index]) return;
      if (s.index < s.n - 1) { s.index++; save(t); render(t, { dir: 1 }); keepInView(t); focusPillar(t); return; }
      s.phase = 'form'; save(t); render(t); keepInView(t); $('h2', u.form).focus({ preventScroll: true }); });
    u.back.addEventListener('click', () => { const s = S[t]; if (s.index === 0) return; s.index--; save(t); render(t, { dir: -1 }); keepInView(t); focusPillar(t); });
    u.backForm.addEventListener('click', () => { const s = S[t]; s.phase = 'scoring'; s.index = s.n - 1; save(t); render(t, { dir: -1 }); keepInView(t); focusPillar(t); });

    /* details form */
    const markInvalid = list => u.fields.forEach(e => e.setAttribute('aria-invalid', String(list.includes(e.dataset.key))));
    u.fields.forEach(e => e.addEventListener('input', () => { S[t].form[e.dataset.key] = e.value; save(t); subject(t); if (S[t].tried) markInvalid(problems(t, S[t].form)); }));
    u.fields.forEach(e => e.addEventListener('change', () => { S[t].form[e.dataset.key] = e.value; save(t); }));
    u.form.addEventListener('submit', e => {
      e.preventDefault(); const s = S[t]; s.tried = true;
      const p = problems(t, s.form); markInvalid(p);
      if (p.length) {
        $('b', u.err).textContent = COPY.validation.title; $('span', u.err).textContent = message(p.length, p[0], !!s.form.email.trim(), !!s.form.website.trim()); u.err.hidden = false;
        const f = u.fields.find(x => x.dataset.key === p[0]); f.focus({ preventScroll: true }); f.scrollIntoView({ behavior: smooth(), block: 'center' });
        return;
      }
      u.err.hidden = true;
      if (!s.ratings.every(x => x > 0)) { $('b', u.err).textContent = COPY.finishFirst.title; $('span', u.err).textContent = COPY.finishFirst.description; u.err.hidden = false; return; }
      pvd.dataset.track = t; pvd.showModal(); $('[data-show]', pvd).focus();
    });
    $('.again', u.notice).addEventListener('click', () => {      // Analyze Another: start this path again
      const s = S[t]; s.ratings.fill(0); s.index = 0; s.phase = 'scoring'; s.tried = false; for (const k in s.form) s.form[k] = '';
      u.fields.forEach(f => { f.value = ''; f.removeAttribute('aria-invalid'); }); u.err.hidden = true;
      try { localStorage.removeItem(KEY(t)); } catch {}
      render(t, { instant: true }); scrollTo({ top: 0, behavior: smooth() }); u.h1.focus({ preventScroll: true });
    });
  }

  /* ---------- Preview disclosure ---------- */
  const pvd = $('#pvd');
  $('[data-close]', pvd).addEventListener('click', () => pvd.close());
  pvd.addEventListener('close', () => { const t = pvd.dataset.track; if (t && S[t].phase === 'form') U[t].submit.focus(); });
  $('[data-show]', pvd).addEventListener('click', () => { const t = pvd.dataset.track; S[t].phase = 'notice'; pvd.close(); render(t);
    U[t].notice.classList.remove('in'); if (!still) { void U[t].notice.offsetWidth; U[t].notice.classList.add('in'); }
    keepInView(t); $('h2', U[t].notice).focus({ preventScroll: true }); });

  /* ---------- Layout changes, visibility of the decorative motion ---------- */
  const ro = new ResizeObserver(() => { if (!cur) return; measure(cur); drawRoute(cur, true); if (S[cur].phase === 'scoring') setMark(cur); });
  TRACKS.forEach(t => ro.observe(U[t].route));
  const playing = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('vis', e.isIntersecting)), { rootMargin: '60px 0px' });
  TRACKS.forEach(t => playing.observe(U[t].route));
  // Below desktop width the floating quick actions would sit over the rating buttons and form fields: keep them away while the card is on screen
  const onCard = new Set(), narrow = matchMedia('(max-width: 1199px)');
  const dock = () => root.classList.toggle('hide-quick', narrow.matches && onCard.size > 0);
  const cardIO = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? onCard.add(e.target) : onCard.delete(e.target)); dock(); }, { rootMargin: '-15% 0px -15% 0px' });
  TRACKS.forEach(t => cardIO.observe(U[t].inst)); narrow.addEventListener?.('change', dock);

  /* ---------- Header, mobile sheet, scroll chrome (shared site behaviour) ---------- */
  const dds = $$('.dd'), burger = $('#burger'), sheet = $('#sheet'), bar = $('#bar'), totop = $('#totop'), quickEl = $('.quick');
  const closeAll = except => dds.forEach(d => { if (d !== except && d.classList.contains('open')) { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); } });
  const openDd = (d, focusFirst) => { closeAll(d); d.classList.add('open'); $('button', d).setAttribute('aria-expanded', 'true'); if (focusFirst) ($('.menu a[aria-current]', d) || $('.menu a', d))?.focus(); };
  dds.forEach(d => {
    const b = $('button', d); let tm;
    b.addEventListener('click', () => d.classList.contains('open') ? closeAll() : openDd(d));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openDd(d, true); } });
    d.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(tm); tm = setTimeout(() => openDd(d), 80); });
    d.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; clearTimeout(tm); tm = setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 220); });
    d.addEventListener('keydown', e => { const links = $$('.menu a', d), k = links.indexOf(document.activeElement);
      if (e.key === 'Escape') { closeAll(); b.focus(); } else if (k >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); links[(k + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus(); } });
    d.addEventListener('focusout', () => setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 0));
    $$('.menu a', d).forEach(a => a.addEventListener('click', () => closeAll()));
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.dd')) closeAll(); });
  function setSheet(open) { sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); root.classList.toggle('sheet-open', open); if (open) ($('a[aria-current]', sheet) || $('a', sheet)).focus(); }
  burger.addEventListener('click', () => setSheet(sheet.hidden));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setSheet(false); });
  $$('.grp > button', sheet).forEach(b => b.addEventListener('click', () => { const s = $('#' + b.getAttribute('aria-controls')), o = s.hidden; s.hidden = !o; b.setAttribute('aria-expanded', String(o)); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });
  matchMedia('(min-width: 1240px)').addEventListener?.('change', e => { if (e.matches) setSheet(false); });
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => { const done = tx => { b.textContent = tx; setTimeout(() => b.textContent = 'Copy', 1600); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); done('Selected'); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(() => done('Copied'), fb); } catch { fb(); } }));
  $$('.pop > button').forEach(b => { const tip = $('#' + b.getAttribute('aria-controls'));
    b.addEventListener('click', () => { const o = tip.hidden; $$('.pop .tip').forEach(x => x.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); tip.hidden = !o; b.setAttribute('aria-expanded', String(o)); }); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop')) { $$('.pop .tip').forEach(x => x.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); } });
  totop.addEventListener('click', () => { scrollTo({ top: 0, behavior: smooth() }); $('#top .brand').focus({ preventScroll: true }); });
  let pending = false, lastY = scrollY, scrolledOn = null;
  const frame = () => { pending = false; const y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${H > 0 ? Math.min(1, Math.max(0, y / H)) : 0})`;
    const sc = y > 8; if (sc !== scrolledOn) { scrolledOn = sc; root.classList.toggle('scrolled', sc); }
    const tt = y < innerHeight; if (totop.hidden !== tt) totop.hidden = tt; };
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(frame); } const y = scrollY, dy = y - lastY; lastY = y;
    if (innerWidth >= 1200 || quickEl.contains(document.activeElement)) root.classList.remove('dock-away');
    else if (dy > 6 && y > 240) root.classList.add('dock-away'); else if (dy < -6 || y < 240) root.classList.remove('dock-away'); }, { passive: true });
  quickEl.addEventListener('focusin', () => root.classList.remove('dock-away'));

  /* ---------- Start ---------- */
  applyStill();
  select(location.hash.slice(1) === 'product' ? 'product' : 'organization', { hash: false });
  document.fonts?.ready.then(() => { if (cur) { measure(cur); drawRoute(cur, true); setMark(cur); } });
  frame();
})();
