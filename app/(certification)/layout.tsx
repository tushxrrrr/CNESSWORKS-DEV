// Shared frame of the three certification pages (/mother-of-certification, /cness-certification,
// /product-certification). It stays in place while the visitor moves between them: header, mobile menu, section
// dots, page switcher, footer, quick actions and the sky. Only the page inside <main> changes.
import type { ReactNode } from 'react';
import '@/src/certification/style.css';
import { MobileSheet, QuickActions, SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import ChromeBehaviour from '@/components/site/ChromeBehaviour';
import { DotNavs, Switcher } from '@/components/certification/CertShell';
import CertificationBehaviour from '@/components/certification/CertificationBehaviour';
import { PAGES, ROUTES } from '@/lib/certification/content';
import { BASE_PATH } from '@/lib/site';

// Before first paint (as the approved page does): mark scripting for the entrances, and pick this page's sky
const EARLY = `(function(){var d=document.documentElement,m=${JSON.stringify(Object.fromEntries(PAGES.map(p => ['/' + p.route, p.key])))},k=m[location.pathname.slice(${JSON.stringify(BASE_PATH)}.length).replace(/\\.html$|\\/$/,'')];d.classList.add('js');if(k)d.dataset.pg=k;})()`;

export default function CertificationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      <a className="skip" href="#main">Skip to content</a>
      <div className="sky" aria-hidden="true"><i data-for="moc" /><i data-for="org" /><i data-for="prd" /></div>
      <SiteHeader routes={ROUTES} section="Certification" />
      <MobileSheet routes={ROUTES} section="Certification" />
      <DotNavs />
      <p className="sr" id="route-status" aria-live="polite" />
      <main id="main">
        <Switcher />
        {children}
      </main>
      <SiteFooter routes={ROUTES} />
      <QuickActions />
      <ChromeBehaviour />
      <CertificationBehaviour />
    </>
  );
}
