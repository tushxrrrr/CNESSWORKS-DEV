import type { Metadata } from 'next';
import { ORG, pageMeta } from '@/lib/certification/content';
import CertPage from '@/components/certification/CertPage';
import OrgPage from '@/components/certification/OrgPage';

const m = pageMeta('org');
export const metadata: Metadata = {
  title: `${m.title} | CNESSWORKS`,
  description: ORG.hero.p,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CertPage page="org"><OrgPage /></CertPage>;
}
