import type { Metadata } from 'next';
import { ADVANTAGE, ADVANTAGE_URL } from '@/lib/advantage/model';
import { pageMetadata } from '@/lib/site';
import { MobileSheet, QuickActions, SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import ChromeBehaviour from '@/components/site/ChromeBehaviour';
import AdvantageSections, { SectionDots } from '@/components/advantage/AdvantageSections';
import AdvantageMotion from '@/components/advantage/AdvantageMotion';

export const metadata: Metadata = pageMetadata('cness-advantage', 'CNESS Advantage', ADVANTAGE.hero.lede);

export default function AdvantagePage() {
  return (
    <>
      {/* Mark scripting before first paint (as the approved page does), so the headline's entrance plays from the start */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <a className="skip" href="#main">Skip to content</a>
      <div className="sky" aria-hidden="true" />
      <div className="field" id="field" aria-hidden="true"><canvas id="f2d" /></div>
      <div className="grain" aria-hidden="true" />
      <SiteHeader current={ADVANTAGE_URL} />
      <MobileSheet current={ADVANTAGE_URL} />
      <SectionDots />
      <AdvantageSections />
      <SiteFooter liveHref={ADVANTAGE_URL} />
      <QuickActions />
      <ChromeBehaviour />
      <AdvantageMotion />
    </>
  );
}
