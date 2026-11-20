import type { Metadata } from 'next';
import { PRD, pageMeta } from '@/lib/certification/content';
import { pageMetadata } from '@/lib/site';
import CertPage from '@/components/certification/CertPage';
import ProductPage from '@/components/certification/ProductPage';

const m = pageMeta('prd');
export const metadata: Metadata = pageMetadata(m.route, `${m.title} | CNESSWORKS`, PRD.hero.p);

export default function Page() {
  return <CertPage page="prd"><ProductPage /></CertPage>;
}
