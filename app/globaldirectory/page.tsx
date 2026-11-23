import type { Metadata } from 'next';
import Script from 'next/script';
import '@/src/directory/style.css';
import { DIRECTORY } from '@/lib/content';
import { asset, pageMetadata } from '@/lib/site';
import { MobileSheet, QuickActions, SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import ChromeBehaviour from '@/components/site/ChromeBehaviour';
import { DirectoryMain, PlanDialog, STRINGS } from '@/components/directory/DirectoryPage';

const CURRENT = 'https://www.cnessworks.com/globaldirectory';

// Title and description as on the live page
export const metadata: Metadata = pageMetadata('globaldirectory', DIRECTORY.documentTitle, DIRECTORY.metaDescription);

export default function GlobalDirectoryPage() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="sky" aria-hidden="true"><i className="graticule" /></div>
      <SiteHeader current={CURRENT} />
      <MobileSheet current={CURRENT} />
      <DirectoryMain />
      <SiteFooter />
      <QuickActions />
      <PlanDialog />
      <div className="rpop" id="rpop" role="dialog" aria-label={DIRECTORY.card.ratingTitle} hidden />
      <p className="sr" id="gd-live" aria-live="polite" />
      <script type="application/json" id="gd-strings" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRINGS).replace(/</g, '\\u003c') }} />
      <ChromeBehaviour />
      {/* the directory's behaviour: the same script as the static page (src/directory/app.js), run once the markup is interactive */}
      <Script src={asset('assets/directory/app.js')} strategy="afterInteractive" />
    </>
  );
}
