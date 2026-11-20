// Shared CNESSWORKS chrome: header, mobile sheet, footer, quick actions. Same markup as tools/site_chrome.py
// (the approved static pages); labels and destinations come from content/cness-advantage.json.
import { SITE } from '@/lib/content';
import { appPath, asset } from '@/lib/site';

const B = 'https://www.cnessworks.com';
type Link = { text: string; url?: string; href?: string };
type NavItem = Link & { menu?: Link[] };

const Ic = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{d}</svg>
);
export const Chev = () => (
  <svg className="chev" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
);
const SOCIAL: Record<string, React.ReactNode> = {
  Facebook: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z" /></svg>,
  YouTube: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" /></svg>,
  Instagram: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" /></svg>,
  LinkedIn: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.5 9h3v11h-3zM6 3.8A1.8 1.8 0 1 1 6 7.4a1.8 1.8 0 0 1 0-3.6zM10 9h2.9v1.5c.4-.8 1.4-1.7 3-1.7 3.1 0 3.6 2 3.6 4.7V20h-3v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20H10z" /></svg>,
};
const slug = (s: string) => s.toLowerCase().replace(/ /g, '-');

// Links to pages this app serves (lib/site.ts) stay in the app (local path, same tab); every link keeps its production
// URL in data-prod-href. routes: production URL -> route for links the page moves between without a reload (the
// certification pages, data-route). section: the menu that holds the current page.
export type Routes = Record<string, string>;
export interface ChromeOpts { current?: string; routes?: Routes; section?: string }

function NavLink({ l, current, routes }: { l: Link; current?: string; routes?: Routes }) {
  const r = l.url ? routes?.[l.url] : undefined;
  return <a href={appPath(l.url) ?? l.url} data-route={r} data-prod-href={l.url} aria-current={l.url === current ? 'page' : undefined}>{l.text}</a>;
}
/** A link that opens the live site in a new tab, or stays in the app when this app serves the page */
function OutLink({ url, className, label, children }: { url: string; className?: string; label?: string; children: React.ReactNode }) {
  const local = appPath(url);
  return local
    ? <a className={className} href={local} data-prod-href={url} aria-label={label}>{children}</a>
    : <a className={className} href={url} data-prod-href={url} target="_blank" rel="noopener" aria-label={label}>{children}</a>;
}

export function SiteHeader({ current, routes, section }: ChromeOpts) {
  const H = SITE.header, nav = H.nav as NavItem[], reg = H.region, [login, start] = H.actions as [Link, Link];
  return (
    <header className="top" id="top">
      <div className="wrap">
        <a className="brand" href={H.logo.url}><img src={asset('assets/logo-white.png')} width={130} height={32} alt="CNESSWORKS home" /></a>
        <nav aria-label="Main">
          <ul className="nav">
            {nav.map(n => n.menu ? (
              <li className={n.text === section ? 'dd cur' : 'dd'} key={n.text}>
                <button type="button" aria-expanded="false" aria-controls={`m-${slug(n.text)}`}>{n.text} <Chev /></button>
                <div className="menu" id={`m-${slug(n.text)}`}>{n.menu.map(x => <NavLink key={x.text} l={x} current={current} routes={routes} />)}</div>
              </li>
            ) : <li key={n.text}><NavLink l={n} current={current} routes={routes} /></li>)}
          </ul>
        </nav>
        <div className="right-acts">
          <div className="region dd">
            <button type="button" aria-expanded="false" aria-controls="m-region" aria-label={`Region: ${reg.text}`}>{reg.text} <Chev /></button>
            <div className="menu right" id="m-region"><RegionLinks /></div>
          </div>
          <a className="login" href={login.url}>{login.text}</a>
          <a className="btn sm" href={start.url}>{start.text}</a>
          <button className="motion" id="motionBtn" type="button" aria-pressed="false" aria-label="Pause motion" title="Pause motion">
            <svg className="pause" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
            <svg className="play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5l7 4.5-7 4.5z" fill="currentColor" /></svg>
          </button>
          <button className="burger" id="burger" type="button" aria-expanded="false" aria-controls="sheet" aria-label="Open navigation menu"><i /></button>
        </div>
      </div>
      <div className="bar" id="bar" aria-hidden="true" />
    </header>
  );
}

function RegionLinks() {
  return <>{SITE.header.region.menu.map(r => (
    <a key={r.code} href={`${B}${r.href}`} lang={r.code === 'JA' ? 'ja' : 'en'}><span className="code">{r.code}</span>{r.text}</a>
  ))}</>;
}

export function MobileSheet({ current, routes, section }: ChromeOpts) {
  const H = SITE.header, nav = H.nav as NavItem[], [login, start] = H.actions as [Link, Link], home = H.mobileOnly[0] as Link;
  return (
    <div className="sheet" id="sheet" hidden>
      <nav className="in" aria-label="Main">
        <NavLink l={home} current={current} routes={routes} />
        {nav.map(n => n.menu ? (
          <div className={n.text === section ? 'grp cur' : 'grp'} key={n.text}>
            <button type="button" aria-expanded={n.text === section ? 'true' : 'false'} aria-controls={`s-${slug(n.text)}`}>{n.text} <Chev /></button>
            <div className="sub" id={`s-${slug(n.text)}`} hidden={n.text !== section}>{n.menu.map(x => <NavLink key={x.text} l={x} current={current} routes={routes} />)}</div>
          </div>
        ) : <NavLink key={n.text} l={n} current={current} routes={routes} />)}
        <div className="regions" role="group" aria-label="Region"><RegionLinks /></div>
        <div className="acts"><a href={login.url}>{login.text}</a><a className="btn" href={start.url}>{start.text}</a></div>
      </nav>
    </div>
  );
}

// liveHref: where the notes for live-only services point (the Advantage page links back to itself on the live site)
export function SiteFooter({ liveHref = `${B}/`, routes }: { liveHref?: string; routes?: Routes } = {}) {
  const F = SITE.footer;
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div className="about">
            <a className="brand" href={`${B}/`} target="_blank" rel="noopener"><img src={asset('assets/logo-white.png')} width={130} height={32} alt="CNESSWORKS home" /></a>
            <p>{F.tagline}</p>
            <address>
              <span>{F.address}</span>
              {F.phones.map(p => (
                <span className="cp" key={p.href}><a href={p.href}>{p.text}</a> <button type="button" data-copy={p.text.split(' ').slice(1).join(' ')} aria-label={`Copy ${p.text}`}>Copy</button></span>
              ))}
            </address>
            <div className="soc">{F.social.map(s => <a key={s.text} href={s.url} target="_blank" rel="noopener" aria-label={s.text}>{SOCIAL[s.text]}</a>)}</div>
          </div>
          {F.columns.map(col => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {((('links' in col ? col.links : (col as { items: Link[] }).items) ?? []) as Link[]).map(l => l.href ? (
                  <li key={l.text}>{appPath(l.url) ? <NavLink l={l} routes={routes} /> : <a href={l.url} data-prod-href={l.url} target="_blank" rel="noopener">{l.text}</a>}</li>
                ) : (
                  <li className="pop" key={l.text}>
                    <button type="button" aria-expanded="false" aria-controls={`tip-${slug(l.text)}`}>{l.text}</button>
                    <span className="tip" id={`tip-${slug(l.text)}`} role="status" hidden>{l.text} opens on the live cnessworks.com site. <a href={liveHref} target="_blank" rel="noopener">Open cnessworks.com</a></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="legal">{F.copyright}</p>
      </div>
    </footer>
  );
}

export function QuickActions() {
  const [a, b] = SITE.quickActions as unknown as [{ text: string; tag: string; url: string }, { text: string; tag: string; url: string }];
  return (
    <div className="quick">
      <button className="totop" id="totop" type="button" aria-label="Scroll to top" hidden><Ic d={<path d="M12 19V5M6 11l6-6 6 6" />} /></button>
      <OutLink className="qa" url={a.url}><span className="lab"><b>{a.text}</b><small>{a.tag}</small></span><span className="ic"><Ic d={<><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5.5 5.5" /><path d="M7.5 12l2-2.5 1.8 1.5 2.2-3" /></>} /></span></OutLink>
      <OutLink className="qa" url={b.url}><span className="lab"><b>{b.text}</b><small>{b.tag}</small></span><span className="ic"><Ic d={<><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>} /></span></OutLink>
    </div>
  );
}
