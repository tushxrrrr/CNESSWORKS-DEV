import type { Metadata } from 'next';
import { PRD, pageMeta } from '@/lib/certification/content';
import CertPage from '@/components/certification/CertPage';
import ProductPage from '@/components/certification/ProductPage';

const m = pageMeta('prd');
export const metadata: Metadata = {
  title: `${m.title} | CNESSWORKS`,
  description: PRD.hero.p,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CertPage page="prd"><ProductPage /></CertPage>;
}
