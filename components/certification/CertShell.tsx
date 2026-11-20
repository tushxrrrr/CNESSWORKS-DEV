// Pieces of the certification layout that are not page content: the page switcher, the per-page section dots
// (hidden except for the page on screen). Same markup as tools/build-certification.py.
'use client';
import { usePathname } from 'next/navigation';
import { CERT_MENU, PAGES, ROUTES, SECTIONS } from '@/lib/certification/content';

const keyFor = (path: string) => PAGES.find(p => path.replace(/\.html$|\/$/, '') === `/${p.route}`)?.key ?? 'moc';

export function Switcher() {
  return (
    <nav className="switch" aria-label="Certification"><div className="wrap"><ul>{CERT_MENU.map((l, i) => {
      const r = ROUTES[l.url]!;
      return <li key={r}><a href={`/${r}`} data-route={r} data-prod-href={l.url}><span className="ix" aria-hidden="true">0{i + 1}</span>{l.text}</a></li>;
    })}</ul></div></nav>
  );
}

export function DotNavs() {
  const cur = keyFor(usePathname());
  return <>{PAGES.map(p => (
    <nav aria-label="Sections" className="dotnav" data-for={p.key} hidden={p.key !== cur} key={p.key}>
      <ul className="dots">{SECTIONS[p.key].map(s => <li key={s.id}><a href={`#${s.id}`}><span>{s.label}</span></a></li>)}</ul>
    </nav>
  ))}</>;
}
