// The Certification section: three pages read from their locked inventories (content/*.json), plus the
// per-page section lists for the dots navigation (same order and labels as tools/build-certification.py).
import moc from '@/content/mother-of-certification.json';
import org from '@/content/cness-certification.json';
import prd from '@/content/product-certification.json';
import { SITE } from '@/lib/content';

export const MOC = moc, ORG = org, PRD = prd;
export const B = 'https://www.cnessworks.com';

export type PageKey = 'moc' | 'org' | 'prd';
export interface PageMeta { key: PageKey; route: string; title: string; url: string }
export const PAGES: PageMeta[] = [
  { key: 'moc', route: 'mother-of-certification', title: 'Mother of Certification', url: `${B}/mother-of-certification` },
  { key: 'org', route: 'cness-certification', title: 'Organization Certification', url: `${B}/cness-certification` },
  { key: 'prd', route: 'product-certification', title: 'Product Certification', url: `${B}/product-certification` },
];
export const pageMeta = (k: PageKey) => PAGES.find(p => p.key === k)!;
/** Production URL -> local route, for links that stay inside the app. */
export const ROUTES: Record<string, string> = Object.fromEntries(PAGES.map(p => [p.url, p.route]));
export const CERT_MENU = (SITE.header.nav as { text: string; menu?: { text: string; url: string }[] }[]).find(n => n.text === 'Certification')!.menu!;

/** Section ids and labels for the dots navigation, in page order. */
export const SECTIONS: Record<PageKey, { id: string; label: string }[]> = {
  moc: [
    { id: 'moc-top', label: MOC.hero.label }, { id: 'moc-industry', label: MOC.industry.label }, { id: 'moc-compare', label: MOC.compare[0]!.label },
    { id: 'moc-cards', label: MOC.cards[0]!.h3 }, { id: 'moc-close', label: MOC.closing.label },
  ],
  org: [
    { id: 'org-top', label: ORG.hero.h1 }, { id: 'org-community', label: ORG.community.h2 }, { id: 'org-why', label: ORG.why.kicker },
    { id: 'org-evaluate', label: ORG.evaluate.label }, { id: 'org-benefits', label: ORG.benefits.h2 }, { id: 'org-how', label: ORG.how.h2 },
    { id: 'org-spotlight', label: ORG.spotlight.h2[0]! }, { id: 'org-levels', label: ORG.levels.h2 }, { id: 'org-faq', label: ORG.faq.h3 }, { id: 'org-begin', label: ORG.begin.h3 },
  ],
  prd: [
    { id: 'prd-top', label: PRD.hero.eyebrow }, { id: 'prd-idea', label: PRD.idea.label }, { id: 'prd-founding', label: PRD.founding.h2 },
    { id: 'prd-evaluate', label: PRD.evaluate.h3 }, { id: 'prd-why', label: PRD.why.h2 }, { id: 'prd-market', label: PRD.market.label },
    { id: 'prd-journey', label: PRD.journey.h2 }, { id: 'prd-pathways', label: PRD.pathways.h2 },
  ],
};
