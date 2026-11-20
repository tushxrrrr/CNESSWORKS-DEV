import type { Metadata } from 'next';
import '@/src/analyze/style.css';
import { ANALYZE, TRACKS, trackPillars } from '@/lib/content';
import { pageMetadata } from '@/lib/site';
import { MobileSheet, QuickActions, SiteFooter, SiteHeader } from '@/components/site/SiteChrome';
import ChromeBehaviour from '@/components/site/ChromeBehaviour';
import AnalyzeApp from '@/components/analyze/AnalyzeApp';
import { TerrainSymbol } from '@/components/analyze/RouteBand';

const CURRENT = 'https://www.cnessworks.com/analyze';

export const metadata: Metadata = pageMetadata('analyze', 'CNESS Analyze', ANALYZE.tracks.organization.heroSubtitle);

// Strings the page uses only from script (validation, busy labels, templates), verbatim from content/analyze.json.
// tools/verify-analyze.js checks this block against the inventory, as on the approved static page.
const COPY = {
  scorer: ANALYZE.scorer, validation: ANALYZE.validation, finishFirst: ANALYZE.finishFirst, emailError: ANALYZE.emailError,
  tracks: Object.fromEntries(TRACKS.map(t => [t, { pillars: trackPillars(t).map(p => p.name), busy: ANALYZE.tracks[t].form.busy }])),
};

export default function AnalyzePage() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="sky" aria-hidden="true" />
      <TerrainSymbol />
      <SiteHeader current={CURRENT} />
      <MobileSheet current={CURRENT} />
      <AnalyzeApp />
      <SiteFooter />
      <QuickActions />
      <script type="application/json" id="an-copy" dangerouslySetInnerHTML={{ __html: JSON.stringify(COPY).replace(/</g, '\\u003c') }} />
      <ChromeBehaviour />
    </>
  );
}
