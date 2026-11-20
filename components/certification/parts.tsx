// Building blocks shared by the three certification pages (same markup as tools/build-certification.py).
// Every approved string carries data-k="<page>:<json path>" so tools/verify-certification.js can resolve it.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { ROUTES } from '@/lib/certification/content';
import { appPath } from '@/lib/site';

export type P = 'moc' | 'org' | 'prd';
/** data-k tag for an inventory path */
export const k = (page: P, ...path: (string | number)[]) => ({ 'data-k': `${page}:${path.join('.')}` });
export const v = (o: Record<string, string | number>) => o as CSSProperties;

/** Link attributes: pages this app serves stay in the app (the certification pages without a reload, data-route);
 *  everything else opens the live site in a new tab. The production URL is always kept in data-prod-href. */
export function linkProps(url: string) {
  const local = appPath(url), r = ROUTES[url];
  if (local) return r ? { href: local, 'data-route': r, 'data-prod-href': url } : { href: local, 'data-prod-href': url };
  return { href: url, 'data-prod-href': url, target: '_blank', rel: 'noopener' };
}
export const Arr = () => <span className="arr" aria-hidden="true">→</span>;
export function Cta({ page, path, l, cls = 'btn' }: { page: P; path: (string | number)[]; l: { text: string; url: string }; cls?: string }) {
  return <a className={cls} {...linkProps(l.url)} {...k(page, ...path)}>{l.text} <Arr /></a>;
}

/** Hero headline words, each in its own span for the entrance (spaces kept as text between them) */
export function Words({ text, start = 0 }: { text: string; start?: number }) {
  return <>{text.split(' ').map((w, i) => <Fragment key={i}>{i ? ' ' : null}<span className="w" style={v({ '--i': start + i })}>{w}</span></Fragment>)}</>;
}

const ic = (d: ReactNode) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{d}</svg>;
export const I = {
  search: ic(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>),
  prev: ic(<path d="M15 5l-7 7 7 7" />),
  next: ic(<path d="M9 5l7 7-7 7" />),
};

/** A section of a certification page (ids and labels also feed the dots navigation, see lib/certification/content.ts) */
export function Sec({ id, label, scene, side, cls = 'sec', children }: { id: string; label: string; scene: number; side?: 'l' | 'r'; cls?: string; children: ReactNode }) {
  return <section className={cls} id={id} data-scene={scene} data-side={side} aria-label={label}>{children}</section>;
}
