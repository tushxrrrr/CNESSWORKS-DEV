import type { Metadata } from 'next';
import { MOC, pageMeta } from '@/lib/certification/content';
import CertPage from '@/components/certification/CertPage';
import MotherPage from '@/components/certification/MotherPage';

const m = pageMeta('moc');
export const metadata: Metadata = {
  title: `${m.title} | CNESSWORKS`,
  description: MOC.hero.p[0],
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CertPage page="moc"><MotherPage /></CertPage>;
}
