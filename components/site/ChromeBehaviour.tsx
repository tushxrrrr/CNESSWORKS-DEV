'use client';
// Behaviour of the shared chrome rendered by SiteChrome.tsx: header menus, mobile sheet, the motion pause button
// (and the reduced-motion preference), reading progress bar, back-to-top, footer copy buttons and notes.
// Same logic as the approved static pages; it works on the server-rendered markup, so nothing re-renders per frame.
import { useEffect } from 'react';

export default function ChromeBehaviour() {
  useEffect(() => {
    const root = document.documentElement; root.classList.add('js');
    const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
    const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
    const off: Array<() => void> = [];
    const on = <K extends keyof HTMLElementEventMap>(el: EventTarget | null, ev: K | string, fn: (e: never) => void, opt?: AddEventListenerOptions) => {
      if (!el) return; el.addEventListener(ev, fn as EventListener, opt); off.push(() => el.removeEventListener(ev, fn as EventListener, opt));
    };

    /* motion: pause button and prefers-reduced-motion share one state (class "still" on <html>) */
    const mq = matchMedia('(prefers-reduced-motion: reduce)'), motionBtn = $<HTMLButtonElement>('#motionBtn');
    let still = mq.matches;
    const applyStill = () => { root.classList.toggle('still', still); if (!motionBtn) return; motionBtn.setAttribute('aria-pressed', String(still)); const l = still ? 'Play motion' : 'Pause motion'; motionBtn.setAttribute('aria-label', l); motionBtn.title = l; };
    on(motionBtn, 'click', () => { still = !still; applyStill(); });
    on(mq, 'change', (e: MediaQueryListEvent) => { still = e.matches; applyStill(); });
    applyStill();
    const smooth = (): ScrollBehavior => (root.classList.contains('still') ? 'auto' : 'smooth');

    /* header menus */
    const dds = $$('.dd');
    const btn = (d: Element) => $<HTMLButtonElement>('button', d)!;
    const closeAll = (except?: Element) => dds.forEach(d => { if (d !== except && d.classList.contains('open')) { d.classList.remove('open'); btn(d).setAttribute('aria-expanded', 'false'); } });
    const openDd = (d: Element, focusFirst?: boolean) => { closeAll(d); d.classList.add('open'); btn(d).setAttribute('aria-expanded', 'true'); if (focusFirst) ($<HTMLElement>('.menu a[aria-current]', d) || $<HTMLElement>('.menu a', d))?.focus(); };
    dds.forEach(d => {
      const b = btn(d); let tm: ReturnType<typeof setTimeout> | undefined;
      on(b, 'click', () => (d.classList.contains('open') ? closeAll() : openDd(d)));
      on(b, 'keydown', (e: KeyboardEvent) => { if (e.key === 'ArrowDown') { e.preventDefault(); openDd(d, true); } });
      on(d, 'pointerenter', (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; clearTimeout(tm); tm = setTimeout(() => openDd(d), 80); });
      on(d, 'pointerleave', (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; clearTimeout(tm); tm = setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 220); });
      on(d, 'keydown', (e: KeyboardEvent) => { const links = $$<HTMLAnchorElement>('.menu a', d), k = links.indexOf(document.activeElement as HTMLAnchorElement);
        if (e.key === 'Escape') { closeAll(); b.focus(); } else if (k >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); links[(k + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus(); } });
      on(d, 'focusout', () => setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 0));
      $$('.menu a', d).forEach(a => on(a, 'click', () => closeAll()));
    });
    on(document, 'pointerdown', (e: PointerEvent) => { if (!(e.target as Element).closest('.dd')) closeAll(); });

    /* mobile sheet */
    const burger = $<HTMLButtonElement>('#burger'), sheet = $<HTMLDivElement>('#sheet');
    const setSheet = (open: boolean) => { if (!sheet || !burger) return; sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); root.classList.toggle('sheet-open', open); if (open) ($('a[aria-current]', sheet) || $('a', sheet))?.focus(); };
    on(burger, 'click', () => setSheet(!!sheet?.hidden));
    on(sheet, 'click', (e: MouseEvent) => { if ((e.target as Element).closest('a')) setSheet(false); });
    if (sheet) $$<HTMLButtonElement>('.grp > button', sheet).forEach(b => on(b, 'click', () => { const s = document.getElementById(b.getAttribute('aria-controls') || ''); if (!s) return; const o = s.hidden; s.hidden = !o; b.setAttribute('aria-expanded', String(o)); }));
    on(document, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Escape' && sheet && !sheet.hidden) { setSheet(false); burger?.focus(); } });
    const wide = matchMedia('(min-width: 1240px)'); on(wide, 'change', (e: MediaQueryListEvent) => { if (e.matches) setSheet(false); });

    /* footer: copy phone numbers, notes for the live-only support links */
    $$<HTMLButtonElement>('[data-copy]').forEach(b => on(b, 'click', () => {
      const done = (t: string) => { b.textContent = t; setTimeout(() => { b.textContent = 'Copy'; }, 1600); };
      const fb = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling!); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); done('Selected'); };
      try { navigator.clipboard.writeText(b.dataset.copy || '').then(() => done('Copied'), fb); } catch { fb(); }
    }));
    const tips = $$('.pop .tip'), popBtns = $$<HTMLButtonElement>('.pop > button');
    popBtns.forEach(b => on(b, 'click', () => { const tip = document.getElementById(b.getAttribute('aria-controls') || ''); if (!tip) return; const o = tip.hidden; tips.forEach(t => { t.hidden = true; }); popBtns.forEach(x => x.setAttribute('aria-expanded', 'false')); tip.hidden = !o; b.setAttribute('aria-expanded', String(o)); }));
    on(document, 'pointerdown', (e: PointerEvent) => { if (!(e.target as Element).closest('.pop')) { tips.forEach(t => { t.hidden = true; }); popBtns.forEach(x => x.setAttribute('aria-expanded', 'false')); } });

    /* scroll chrome: progress bar, header state, back to top, quick-action dock */
    const bar = $('#bar'), totop = $<HTMLButtonElement>('#totop'), quick = $('.quick');
    on(totop, 'click', () => { scrollTo({ top: 0, behavior: smooth() }); $<HTMLElement>('#top .brand')?.focus({ preventScroll: true }); });
    let pending = false, lastY = scrollY, scrolledOn: boolean | null = null;
    const frame = () => { pending = false; const y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${H > 0 ? Math.min(1, Math.max(0, y / H)) : 0})`;
      const sc = y > 8; if (sc !== scrolledOn) { scrolledOn = sc; root.classList.toggle('scrolled', sc); }
      const tt = y < innerHeight; if (totop && totop.hidden !== tt) totop.hidden = tt; };
    on(window, 'scroll', () => { if (!pending) { pending = true; requestAnimationFrame(frame); } const y = scrollY, dy = y - lastY; lastY = y;
      if (innerWidth >= 1200 || quick?.contains(document.activeElement)) root.classList.remove('dock-away');
      else if (dy > 6 && y > 240) root.classList.add('dock-away'); else if (dy < -6 || y < 240) root.classList.remove('dock-away'); }, { passive: true });
    on(quick, 'focusin', () => root.classList.remove('dock-away'));
    frame();
    return () => off.forEach(f => f());
  }, []);
  return null;
}
