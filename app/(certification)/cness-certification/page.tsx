import type { Metadata } from 'next';
import { ORG, pageMeta } from '@/lib/certification/content';
import { pageMetadata } from '@/lib/site';
import CertPage from '@/components/certification/CertPage';
import OrgPage from '@/components/certification/OrgPage';

const m = pageMeta('org');
export const metadata: Metadata = pageMetadata(m.route, `${m.title} | CNESSWORKS`, ORG.hero.p);

export default function Page() {
  return <CertPage page="org"><OrgPage /></CertPage>;
}
