'use client';
// Moving between the three certification pages, as on the approved page: a link to another certification page
// fades the current page out, the app navigates without a reload, and the new page fades in with focus on its
// heading. The header, page switcher, footer and sky stay in place (app/(certification)/layout.tsx). On every page
// change this also marks the current page in the header, mobile menu and switcher, shows that page's section dots,
// sets the sky, and starts the page's motion and interactions (lib/certification/motion.ts).
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PAGES } from '@/lib/certification/content';
import { startCertPage } from '@/lib/certification/motion';

const still = () => document.documentElement.classList.contains('still');

export default function CertificationBehaviour() {
  const pathname = usePathname();
  const router = useRouter();
  const first = useRef(true);

  // routed links: leave, then navigate inside the app. A page is prefetched once the visitor shows intent (pointer
  // over, focus or touch on a link to it), not on every load, so phones don't download pages nobody opens.
  useEffect(() => {
    const warm = new Set<string>();
    const intent = (e: Event) => { const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-route]'); const r = a?.dataset.route;
      if (r && !warm.has(r) && PAGES.some(p => p.route === r)) { warm.add(r); router.prefetch(`/${r}`); } };
    const evs = ['pointerover', 'focusin', 'touchstart'] as const;
    evs.forEach(ev => document.addEventListener(ev, intent, { passive: true }));
    let t: ReturnType<typeof setTimeout> | undefined;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-route]'); if (!a) return;
      e.preventDefault();
      const route = a.dataset.route!, pg = document.querySelector<HTMLElement>('.pg');
      if (pg?.id === route) { scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }); return; }   // re-selecting the current page goes to its top
      if (!pg || still()) { router.push(`/${route}`, { scroll: false }); return; }
      pg.classList.add('leaving'); clearTimeout(t);
      t = setTimeout(() => router.push(`/${route}`, { scroll: false }), 170);
    };
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('click', onClick); evs.forEach(ev => document.removeEventListener(ev, intent)); clearTimeout(t); };
  }, [router]);

  // the page on screen: navigation state, arrival, motion
  useEffect(() => {
    const root = document.documentElement, pg = document.querySelector<HTMLElement>('.pg'); if (!pg) return;
    const key = pg.dataset.page!, route = pg.id;
    document.querySelectorAll<HTMLAnchorElement>('a[data-route]').forEach(a => {
      if (!a.closest('header, .sheet, .switch')) return;
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.querySelectorAll<HTMLElement>('.dotnav').forEach(n => { n.hidden = n.dataset.for !== key; });
    root.dataset.pg = key;
    if (!first.current) {
      const id = decodeURIComponent(location.hash.slice(1)), target = id ? document.getElementById(id) : null;
      // jump, don't glide: the page has just been replaced (Next.js 16 leaves the page's smooth scrolling on during navigation)
      if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' }); else scrollTo({ top: 0, behavior: 'instant' });
      if (!still()) { pg.classList.remove('entering'); void pg.offsetWidth; pg.classList.add('entering'); }
      pg.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    } else {
      // a direct link to a section: settle the jump again once fonts and images have set the final layout,
      // unless the visitor has already started scrolling
      const id = decodeURIComponent(location.hash.slice(1)), t = id ? document.getElementById(id) : null;
      if (t && !t.classList.contains('pg')) {
        let live = true; const stop = () => { live = false; };
        ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, stop, { once: true, passive: true }));
        const settle = () => { if (live) t.scrollIntoView({ block: 'start' }); };
        document.fonts?.ready.then(() => requestAnimationFrame(settle)); addEventListener('load', settle, { once: true });
        setTimeout(settle, 450); setTimeout(() => { settle(); live = false; }, 1200);
      }
    }
    first.current = false;
    return startCertPage(pg);
  }, [pathname]);

  return null;
}
