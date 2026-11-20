// The page wrapper (one per route): the approved page's <article class="pg">, which the motion and the page
// transitions address.
import type { ReactNode } from 'react';
import { pageMeta, type PageKey } from '@/lib/certification/content';

export default function CertPage({ page, children }: { page: PageKey; children: ReactNode }) {
  const m = pageMeta(page);
  return <article className="pg" id={m.route} data-page={m.key} data-title={m.title}>{children}</article>;
}
