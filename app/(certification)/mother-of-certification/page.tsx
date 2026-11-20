import type { Metadata } from 'next';
import { MOC, pageMeta } from '@/lib/certification/content';
import { pageMetadata } from '@/lib/site';
import CertPage from '@/components/certification/CertPage';
import MotherPage from '@/components/certification/MotherPage';

const m = pageMeta('moc');
export const metadata: Metadata = pageMetadata(m.route, `${m.title} | CNESSWORKS`, MOC.hero.p[0]!);

export default function Page() {
  return <CertPage page="moc"><MotherPage /></CertPage>;
}
