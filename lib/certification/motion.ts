// Certification page motion and interactions, ported from the approved page (src/certification/motion.js) with the
// same numbers. startCertPage() runs for the page on screen and returns a cleanup for when the visitor moves to
// another certification page. Graphics are CSS-driven: this code only toggles classes and a few CSS variables.
// Arrivals and graphic playback come from IntersectionObservers; scroll work is one requestAnimationFrame per frame;
// every animated property is transform or opacity. The shared chrome (menus, mobile sheet, pause button, progress
// bar, back to top) lives in components/site/ChromeBehaviour.tsx; its pause state is the class "still" on <html>.

type El = HTMLElement & { _p?: number | null };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function startCertPage(pg: HTMLElement): () => void {
  const root = document.documentElement;
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
  const off: Array<() => void> = [];
  const on = (el: EventTarget | null | undefined, ev: string, fn: (e: never) => void, opt?: AddEventListenerOptions) => {
    if (!el) return; el.addEventListener(ev, fn as EventListener, opt); off.push(() => el.removeEventListener(ev, fn as EventListener, opt));
  };
  const timers = new Set<ReturnType<typeof setTimeout>>(); const later = (f: () => void, ms: number) => { const t = setTimeout(() => { timers.delete(t); f(); }, ms); timers.add(t); return t; };
  off.push(() => timers.forEach(clearTimeout));
  const CW = { still: root.classList.contains('still') || matchMedia('(prefers-reduced-motion: reduce)').matches };

  /* ---------- Observers: arrivals (once), graphics playing only while on screen, current section ---------- */
  const arrive = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('in'); arrive.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('[data-in], .art, .dawn', pg).forEach(el => arrive.observe(el));
  const onScreen = new Set<Element>();
  const playing = new IntersectionObserver(es => es.forEach(e => { e.target.classList.toggle('vis', e.isIntersecting); if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); }), { rootMargin: '80px 0px' });
  $$('.art, [data-fill]', pg).forEach(el => playing.observe(el));
  const dn = $(`.dotnav[data-for="${pg.dataset.page}"]`);
  const sectionNow = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting || !dn) return;
    $$('a', dn).forEach(a => a.getAttribute('href') === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-scene]', pg).forEach(el => sectionNow.observe(el));
  off.push(() => { arrive.disconnect(); playing.disconnect(); sectionNow.disconnect(); });

  /* ---------- One scroll frame: step runners, header over daylight, quick actions near the close ---------- */
  const fills = $$<El>('[data-fill]', pg), dawn = $('.dawn', pg);
  let vh = innerHeight, pending = false, raf = 0, lastY = scrollY, dayOn: boolean | null = null, quickOn: boolean | null = null;
  // track lengths for the step runners (layout reads happen here, on resize and page change only)
  function measure() { vh = innerHeight; for (const f of fills) { const j = f.classList.contains('j7'), vertical = j || innerWidth <= 960;
    f.style.setProperty('--len', Math.max(0, (vertical ? f.clientHeight : f.clientWidth) - (j ? 40 : 44)) + 'px'); f._p = null; } }
  function frame() {
    pending = false; raf = 0;
    for (const f of fills) {
      if (!onScreen.has(f) && !CW.still) continue;
      const r = f.getBoundingClientRect(), p = CW.still ? 1 : clamp((vh * .62 - r.top) / Math.max(1, r.height));
      if (f._p === p) continue; f._p = p; f.style.setProperty('--fill', p.toFixed(4)); f.classList.toggle('moving', p > 0 && p < 1);
      const items = $$('[data-stepi]', f), k = Math.min(items.length - 1, Math.floor(p * items.length * .999)); items.forEach((li, j) => li.classList.toggle('on', j <= k && p > 0));
    }
    if (dawn) { const r = dawn.getBoundingClientRect(); const day = r.top < 40 && r.bottom > 80, hq = r.top < vh * .7;
      if (day !== dayOn) { dayOn = day; root.classList.toggle('day', day); } if (hq !== quickOn) { quickOn = hq; root.classList.toggle('hide-quick', hq); } }
  }
  const queue = () => { if (!pending) { pending = true; raf = requestAnimationFrame(frame); } };
  off.push(() => { cancelAnimationFrame(raf); root.classList.remove('day', 'hide-quick', 'sw-away'); });
  on(window, 'scroll', () => { queue(); const y = scrollY, dy = y - lastY; lastY = y;
    if (dy > 6 && y > 420) root.classList.add('sw-away'); else if (dy < -6 || y < 420) root.classList.remove('sw-away'); }, { passive: true });   // the page switcher steps aside while reading down
  let rz: ReturnType<typeof setTimeout> | undefined; on(window, 'resize', () => { if (rz) clearTimeout(rz); rz = later(() => { measure(); queue(); }, 120); });

  /* ---------- Pause button / reduced motion (state set by the shared chrome) ---------- */
  const applyStill = () => { if (CW.still) $$('[data-in], .art, .dawn', pg).forEach(el => el.classList.add('in')); measure(); queue(); };
  const mo = new MutationObserver(() => { const s = root.classList.contains('still'); if (s !== CW.still) { CW.still = s; applyStill(); } });
  mo.observe(root, { attributes: true, attributeFilter: ['class'] }); off.push(() => mo.disconnect());

  /* ---------- Pointer depth: graphics on screen lean toward the pointer (mouse only, coalesced per frame) ---------- */
  let ptr: [number, number] | null = null, ptrPending = false;
  on(window, 'pointermove', (e: PointerEvent) => { if (e.pointerType !== 'mouse' || CW.still) return; ptr = [e.clientX / innerWidth - .5, e.clientY / innerHeight - .5];
    if (!ptrPending) { ptrPending = true; requestAnimationFrame(() => { ptrPending = false; if (!ptr) return; for (const a of onScreen) if (a.hasAttribute('data-par')) { (a as HTMLElement).style.setProperty('--px', ptr[0].toFixed(3)); (a as HTMLElement).style.setProperty('--py', ptr[1].toFixed(3)); } }); } }, { passive: true });

  /* ---------- Shared small interactions ---------- */
  const glow = (el: HTMLElement) => on(el, 'pointermove', (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  $$('.lcard, .pbtn, .p7 li', pg).forEach(glow);
  // hover on mouse, focus on keyboard, tap on touch: each list lights its own graphic
  const linkHi = (els: HTMLElement[], set: (el: HTMLElement | null) => void) => els.forEach(el => {
    on(el, 'pointerenter', (e: PointerEvent) => { if (e.pointerType === 'mouse') set(el); });
    on(el, 'pointerleave', (e: PointerEvent) => { if (e.pointerType === 'mouse') set(null); });
    on(el, 'focusin', () => set(el)); on(el, 'focusout', () => set(null));
    on(el, 'pointerdown', (e: PointerEvent) => { if (e.pointerType === 'mouse') return; const was = el.classList.contains('on'); els.forEach(x => x.classList.remove('on')); el.classList.toggle('on', !was); set(was ? null : el); }); });
  const attr = (el: Element | null, val: string | null | undefined) => { if (!el) return; if (val == null) el.removeAttribute('data-on'); else el.setAttribute('data-on', val); };
  // Organization: chips light their column; pillar cards turn the wheel (shortest way round)
  const temple = $$('.temple li', pg), wheel = $('.wheel', pg), wrot = wheel && $('.rot', wheel); let wAng = 0;
  linkHi($$('.chip6', pg), el => temple.forEach((c, k) => c.classList.toggle('on', !!el && k === +(el.dataset.col ?? -1))));
  const turn = (k: number | null) => { if (!wheel || !wrot) return; attr(wheel, k == null ? null : String(k)); if (k == null) return; let t = -30 - 60 * k; while (t - wAng > 180) t -= 360; while (wAng - t > 180) t += 360; wAng = t; wrot.style.setProperty('--rot', t + 'deg'); };
  linkHi($$('.pbtn', pg), el => turn(el ? +(el.dataset.pillar ?? 0) : null));
  // Product: petals
  const bloom = $('.bloom', pg);
  linkHi($$('.p7 li', pg), el => attr(bloom, el ? (el.classList.contains('total') ? 'all' : el.dataset.pillar) : null));

  /* ---------- A. Mother of Certification: region filters, search, show more ---------- */
  (() => {
    const tbl = $('#moc-tbl', pg); if (!tbl) return;
    const rows = $$<HTMLTableRowElement>('tbody tr:not(.empty)', tbl), empty = $<HTMLTableRowElement>('tr.empty', tbl)!, more = $<HTMLButtonElement>('#moc-more', pg)!, q = $<HTMLInputElement>('#moc-q', pg)!, count = $('#moc-count', pg)!, btns = $$<HTMLButtonElement>('.seg button', pg);
    let region = 'All', expanded = false, timer: ReturnType<typeof setTimeout> | undefined;
    const apply = (animate: boolean) => {
      const term = q.value.trim().toLowerCase();
      const match = rows.filter(r => (region === 'All' || r.dataset.r === region) && (!term || (r.dataset.q ?? '').includes(term)));
      let shown = 0;
      rows.forEach(r => { r.hidden = true; r.classList.remove('in'); });
      match.forEach((r, i) => { const vis = expanded || i < 5; r.hidden = !vis; if (vis) { shown++; if (animate && !CW.still) { r.style.setProperty('--d', String(Math.min(i, 24))); r.classList.add('in'); } } });
      empty.hidden = match.length > 0;
      more.hidden = match.length <= 5 && !expanded;
      more.textContent = (expanded ? more.dataset.less : more.dataset.more) ?? ''; more.setAttribute('aria-expanded', String(expanded));
      if (timer) clearTimeout(timer); timer = later(() => { count.textContent = `${shown} of ${match.length}`; }, 350);
    };
    const map = $('.wmap', pg);
    btns.forEach(b => on(b, 'click', () => { region = b.dataset.f ?? 'All'; map?.setAttribute('data-region', region); btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); apply(true); }));
    on(q, 'input', () => apply(false));
    on(more, 'click', () => { expanded = !expanded; apply(expanded); if (!expanded) $('#moc-table', pg)?.scrollIntoView({ behavior: CW.still ? 'auto' : 'smooth', block: 'start' }); });
    apply(false);
    const fig = $('.fig', pg); if (fig) {
      on(fig, 'pointermove', (e: PointerEvent) => { if (CW.still || e.pointerType !== 'mouse') return; const r = fig.getBoundingClientRect(); fig.style.setProperty('--tx', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg'); fig.style.setProperty('--ty', -((e.clientY - r.top) / r.height - .5) * 6 + 'deg'); });
      on(fig, 'pointerleave', () => { fig.style.setProperty('--tx', '0deg'); fig.style.setProperty('--ty', '0deg'); });
    }
  })();

  /* ---------- B. Organization Certification: pillar dialogs, testimonial carousel, FAQ tabs ---------- */
  (() => {
    const dlgs = $$<HTMLDialogElement>('dialog.pd', pg); let opener: HTMLElement | null = null;
    const n = dlgs.length;
    const open = (i: number, from?: HTMLElement | null) => { const j = ((i % n) + n) % n, d = dlgs[j]!; dlgs.forEach(x => x.open && x.close());
      if (from) { const r = from.getBoundingClientRect(); d.style.setProperty('--ox', (r.left + r.width / 2) + 'px'); d.style.setProperty('--oy', (r.top + r.height / 2) + 'px'); }
      d.showModal(); turn(j); };
    const pbtns = $$('.pbtn', pg);
    pbtns.forEach((b, i) => on(b, 'click', () => { opener = b; open(i, b); }));
    $$('.chip6', pg).forEach(b => on(b, 'click', () => { opener = b; open(+(b.dataset.openPillar ?? 0), b); }));       // hero chips open the same details
    $$('.wheel .seg', pg).forEach(sg => on(sg, 'click', () => { const i = +(sg.getAttribute('data-i') ?? 0); opener = pbtns[i] ?? null; open(i, opener); }));
    dlgs.forEach((d, i) => { $$('[data-step]', d).forEach(s => on(s, 'click', () => open(i + +(s.dataset.step ?? 0)))); on($('[data-close]', d), 'click', () => d.close());
      on(d, 'click', (e: MouseEvent) => { if (e.target === d) d.close(); }); on(d, 'close', () => { if (!dlgs.some(x => x.open)) { turn(null); opener?.focus(); } }); });
    off.push(() => dlgs.forEach(d => d.open && d.close()));
    const car = $('.car', pg); if (car) {
      const slides = $$('.slide', car), ticks = $$('.dots2 i', pg); let k = 0;
      const go = (m: number, dir: number) => { k = ((m % slides.length) + slides.length) % slides.length; slides.forEach((s, j) => { s.style.setProperty('--dx', (dir > 0 ? (j === k ? 24 : -24) : (j === k ? -24 : 24)) + 'px'); s.setAttribute('aria-hidden', String(j !== k)); }); ticks.forEach((t, j) => t.classList.toggle('on', j === k)); };
      $$('[data-car]', pg).forEach(b => on(b, 'click', () => go(k + +(b.dataset.car ?? 0), +(b.dataset.car ?? 0))));
      let sx: number | null = null; on(car, 'pointerdown', (e: PointerEvent) => { sx = e.clientX; }); on(car, 'pointerup', (e: PointerEvent) => { if (sx != null && Math.abs(e.clientX - sx) > 40) go(k + (e.clientX < sx ? 1 : -1), e.clientX < sx ? 1 : -1); sx = null; });
      on(car, 'keydown', (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(k + 1, 1); if (e.key === 'ArrowLeft') go(k - 1, -1); });
    }
    const tabs = $$<HTMLButtonElement>('.faq-t [role="tab"]', pg);
    const sel = (t: HTMLButtonElement, focus?: boolean) => { tabs.forEach(x => { const o = x === t; x.setAttribute('aria-selected', String(o)); x.tabIndex = o ? 0 : -1; const panel = document.getElementById(x.getAttribute('aria-controls') ?? ''); if (panel) panel.hidden = !o; }); if (focus) t.focus(); };
    tabs.forEach((t, i) => { on(t, 'click', () => sel(t)); on(t, 'keydown', (e: KeyboardEvent) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (e.key === 'Home') sel(tabs[0]!, true); if (e.key === 'End') sel(tabs[tabs.length - 1]!, true); if (d) { e.preventDefault(); sel(tabs[(i + d + tabs.length) % tabs.length]!, true); } }); });
  })();

  /* ---------- C. Product Certification: market evidence deck ---------- */
  // Tabs, arrows, drag/swipe and sideways trackpad scroll all move one track. A drag follows the pointer 1:1
  // (rubber-banding past the ends); on release the gesture's velocity projects where it was heading and hands
  // over to a critically damped spring, which a new gesture can catch at any moment. Under reduced motion or
  // the pause button the track moves without animation.
  (() => {
    const deck = $('[data-deck]', pg); if (!deck) return;
    const view = $('.deck-view', deck)!, track = $('.deck-track', deck)!, slides = $$('.mslide', deck), tabs = $$<HTMLButtonElement>('[role="tab"]', deck);
    const [prev, next] = $$<HTMLButtonElement>('.da', deck) as [HTMLButtonElement, HTMLButtonElement], count = $('.dc b', deck)!, prog = $('.deck-prog i', deck)!, live = $('[data-deck-status]', deck)!;
    const N = slides.length, RESP = .42;
    let k = 0, W = view.clientWidth, x = 0, v = 0, target = 0, zeta = 1, sraf = 0, last = 0;
    const set = (px: number) => { x = px; track.style.transform = `translate3d(${px.toFixed(2)}px, 0, 0)`; };
    const rubber = (o: number, d: number) => (o * d * .55) / (d + .55 * o);
    const project = (vel: number) => vel / 1000 * .998 / (1 - .998);
    const step = (now: number) => {
      const dt = Math.min(.034, (now - last) / 1000 || .016), w = 2 * Math.PI / RESP; last = now;
      for (let i = 0; i < 4; i++) { const h = dt / 4; v += (-w * w * (x - target) - 2 * zeta * w * v) * h; x += v * h; }
      if (Math.abs(x - target) < .4 && Math.abs(v) < 10) { v = 0; sraf = 0; set(target); return; }
      set(x); sraf = requestAnimationFrame(step);
    };
    off.push(() => cancelAnimationFrame(sraf));
    const settle = (vel = 0, z = 1) => {
      target = -k * W;
      if (CW.still || !W) { cancelAnimationFrame(sraf); sraf = 0; v = 0; set(target); return; }
      v = vel; zeta = z; if (!sraf) { last = performance.now(); sraf = requestAnimationFrame(step); }
    };
    const go = (n: number, o: { v?: number; z?: number; say?: boolean; tab?: boolean } = {}) => {
      n = clamp(n, 0, N - 1); const changed = n !== k; k = n;
      slides.forEach((s, i) => { const o2 = i === k; s.classList.toggle('on', o2); (s as HTMLElement & { inert: boolean }).inert = !o2; });
      tabs.forEach((t, i) => { const o2 = i === k; t.setAttribute('aria-selected', String(o2)); t.tabIndex = o2 ? 0 : -1; });
      const had = document.activeElement; prev.disabled = k === 0; next.disabled = k === N - 1;
      if (had && (had as HTMLButtonElement).disabled) (had === prev ? next : prev).focus();
      count.textContent = String(k + 1).padStart(2, '0'); prog.style.setProperty('--p', ((k + 1) / N).toFixed(4));
      if (changed && o.say) live.textContent = `${k + 1} of ${N}: ${$('[data-k]', tabs[k])?.textContent ?? ''}`;
      if (o.tab) tabs[k]!.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      settle(o.v ?? 0, o.z ?? 1);
    };
    tabs.forEach((t, i) => {
      on(t, 'click', () => go(i));
      on(t, 'keydown', (e: KeyboardEvent) => {
        const n = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? N - 1 : null;
        if (n == null) return; e.preventDefault(); go((n + N) % N, { tab: true }); tabs[k]!.focus();
      });
    });
    [prev, next].forEach(b => on(b, 'click', () => go(k + +(b.dataset.step ?? 0), { say: true, tab: true })));

    // drag and swipe: horizontal intent only (vertical stays page scroll), 10px before committing to an axis
    let drag: { id: number; x0: number; y0: number; from: number; k0: number; axis: 'x' | null; hist: [number, number][] } | null = null, dragged = false;
    on(view, 'pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, from: x, k0: k, axis: null, hist: [[e.clientX, e.timeStamp]] }; dragged = false;
    });
    on(view, 'pointermove', (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.axis) {
        const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0; if (Math.hypot(dx, dy) < 10) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        drag.axis = 'x'; dragged = true; view.setPointerCapture(e.pointerId); view.classList.add('drag'); getSelection()?.removeAllRanges();
        cancelAnimationFrame(sraf); sraf = 0; drag.from = x; drag.x0 = e.clientX;   // catch the track where it is, mid-flight included
      }
      const min = -(N - 1) * W; let p = drag.from + (e.clientX - drag.x0);
      if (p > 0) p = rubber(p, W); else if (p < min) p = min - rubber(min - p, W);
      set(p); drag.hist.push([e.clientX, e.timeStamp]); if (drag.hist.length > 6) drag.hist.shift();
    });
    const end = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; view.classList.remove('drag'); if (!d.axis) return;
      const a = d.hist[0]!, b = d.hist[d.hist.length - 1]!, dt = (b[1] - a[1]) / 1000;
      const vel = e.type === 'pointerup' && dt > 0 && e.timeStamp - b[1] < 90 ? (b[0] - a[0]) / dt : 0;
      const n = clamp(Math.round(-(x + project(vel)) / W), d.k0 - 1, d.k0 + 1);
      go(n, { v: vel, z: Math.abs(vel) > 400 ? .82 : 1, say: true, tab: true });
    };
    on(view, 'pointerup', end); on(view, 'pointercancel', end);
    on(view, 'click', (e: MouseEvent) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, { capture: true });
    on(view, 'dragstart', (e: DragEvent) => e.preventDefault());

    // sideways trackpad scroll glides one statistic per gesture (momentum tail ignored until it goes quiet)
    let acc = 0, quietAt = 0;
    on(view, 'wheel', (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault();
      const now = performance.now(); if (now < quietAt) { quietAt = now + 180; return; }
      acc += e.deltaX; if (Math.abs(acc) < 36) return;
      const n = k + Math.sign(acc); acc = 0; quietAt = now + 450; if (n >= 0 && n < N) go(n, { say: true, tab: true });
    }, { passive: false });

    const ro = new ResizeObserver(() => { const w = view.clientWidth; if (w === W) return; W = w; cancelAnimationFrame(sraf); sraf = 0; v = 0; target = -k * W; set(target); }); ro.observe(view); off.push(() => ro.disconnect());
    go(0);
  })();

  applyStill();
  return () => off.forEach(f => f());
}
