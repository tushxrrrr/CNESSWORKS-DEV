// Global Directory page body: the same markup as tools/build-directory.py (the approved static page), rendered on the
// server from content/global-directory.json. Results, filters, panels, the lens and dialogs are run by the shared
// script src/directory/app.js (copied to public/assets/directory/app.js by scripts/sync-assets.mjs), loaded by the route.
// Every approved string carries data-k="gd:<path>" for tools/verify-directory.js.
import { DIRECTORY as C } from '@/lib/content';
import { asset, BASE_PATH } from '@/lib/site';
import UI from '@/src/directory/ui.json';

const K = (...p: (string | number)[]) => ({ 'data-k': `gd:${p.join('.')}` });
const Ic = ({ d, sw = '1.5' }: { d: React.ReactNode; sw?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{d}</svg>
);
const Chev = () => <svg className="chev" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
const X = () => <Ic sw="2" d={<path d="M6 6l12 12M18 6L6 18" />} />;
const Check = () => <Ic sw="2" d={<path d="M5 12.5l4.5 4.5L19 7.5" />} />;
const Arrow = () => <span className="arr" aria-hidden="true">→</span>;
// Focus areas: original line marks (same drawings as the static page)
const FOCUS_IC: Record<string, React.ReactNode> = {
  'IT Services': <><rect x="4" y="4.5" width="16" height="5.5" rx="1.4" /><rect x="4" y="14" width="16" height="5.5" rx="1.4" /><path d="M7.5 7.25h.01M7.5 16.75h.01M11 7.25h5M11 16.75h5M12 10v4" /></>,
  Restaurants: <><path d="M7 3.5v7.5M4.8 3.5v4.2a2.2 2.2 0 0 0 4.4 0V3.5M7 11v9.5" /><path d="M17 20.5v-17c-2.2 1-3.4 3.6-3.4 6.6 0 2 .9 3.2 3.4 3.4" /></>,
  Wellness: <><path d="M12 20c-4.6-2.3-7.5-5.6-7.5-9.4A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.5 2c0 3.8-2.9 7.1-7.5 9.4z" /><path d="M8.5 13h2l1-2.2 1.6 4 .9-1.8h1.5" /></>,
  Technology: <><rect x="6.5" y="6.5" width="11" height="11" rx="2" /><rect x="9.6" y="9.6" width="4.8" height="4.8" rx=".8" /><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" /></>,
  Sustainability: <><path d="M12 20.5v-7" /><path d="M12 13.5c0-4 2.6-6.6 7-6.8.1 4.3-2.7 6.8-7 6.8z" /><path d="M12 15.5C12 12.2 9.9 10 6 10c0 3.4 2.2 5.5 6 5.5z" /><path d="M4.5 20.5h15" /></>,
  Consulting: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3.2A2.5 2.5 0 0 1 4 10.5z" /><path d="M18.2 9.2A2.4 2.4 0 0 1 20 11.5v3.8a2.4 2.4 0 0 1-1.6 2.3V20l-3-2.5h-3" /></>,
};
type Key = 'what' | 'where';

function Field({ k }: { k: Key }) {
  const f = C.search[k];
  return (
    <div className="fld" data-field={k}>
      <button type="button" className="fld-btn" id={`f-${k}`} aria-expanded="false" aria-controls={`p-${k}`} aria-haspopup="dialog">
        <span className="fl" {...K('search', k, 'label')}>{f.label}</span>
        <span className="fv" data-ph={f.placeholder}><span className="ph" {...K('search', k, 'placeholder')}>{f.placeholder}</span></span>
        <Chev />
      </button>
      <button type="button" className="fx" data-clear={k} aria-label={C.search.clear} {...(k === 'what' ? K('search', 'clear') : {})} hidden><X /></button>
      <div className="panel" id={`p-${k}`} role="dialog" aria-label={f.label} hidden />
    </div>
  );
}

function Filters({ inst }: { inst: 'feat' | 'list' }) {
  const F = C.filters, tag = (...p: string[]) => (inst === 'list' ? K('filters', ...p) : {});
  const Sel = ({ name, ph, opts, all }: { name: string; ph: string; opts: string[][]; all: string }) => (
    <label className="sel" data-f={name}>
      <span className="sv" {...tag(name, 'placeholder')}>{ph}</span>
      <select aria-label={ph} data-f={name} defaultValue="All">
        <option value="All">{all}</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <Chev />
    </label>
  );
  return (
    <div className="filters" data-inst={inst}>
      <Sel name="badge" ph={F.badge.placeholder} opts={F.badge.options} all={`All ${F.badge.placeholder}s`} />
      <Sel name="size" ph={F.size.placeholder} opts={F.size.options} all={`All ${F.size.placeholder}s`} />
      <Sel name="industry" ph={F.industry.placeholder} opts={[]} all={F.industry.all} />
      <Sel name="country" ph={F.country.placeholder} opts={[]} all={F.country.all} />
      <label className="chk"><input type="checkbox" data-f="certified" /><span className="box" aria-hidden="true"><Check /></span><span {...tag('certified')}>{F.certified}</span></label>
      <button type="button" className="clr" data-clear-filters hidden><X /><span {...tag('clear')}>{F.clear}</span></button>
    </div>
  );
}

function PlanCard({ p }: { p: (typeof C.plans.items)[number] }) {
  const prem = p.id === 'premium';
  return (
    <article className={`plan-card ${p.id}`} data-plan-card={p.id} hidden>
      {prem && <><span className="pbadge" {...K('plans', 'premiumBadge')}>{C.plans.premiumBadge}</span><span className="psup" {...K('plans', 'premiumSupport')}>{C.plans.premiumSupport}</span></>}
      <h3 {...K('plans', p.id, 'title')}>{p.title.trim()}</h3>
      <p className="plead" {...K('plans', p.id, 'lead')}>{p.lead}</p>
      <ul>
        {p.points.map((x, i) => <li className="pt" key={'p' + i}><Check /><span {...K('plans', p.id, 'points', i)}>{x}</span></li>)}
        {p.features.map(([a, b], i) => <li key={'f' + i}><Check /><span><b {...K('plans', p.id, 'features', i, 0)}>{a}</b><span {...K('plans', p.id, 'features', i, 1)}>{b}</span></span></li>)}
      </ul>
    </article>
  );
}

export function DirectoryMain() {
  const tiers = C.card.tiers as Record<string, string>;
  return (
    <main id="main" data-gd data-src={asset('assets/directory/data.json')} data-assets={`${BASE_PATH}/`} data-chrome="app">
      <section className="gd-hero" aria-labelledby="h-gd">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1 id="h-gd" {...K('hero', 'h1')}>{C.hero.h1.split(' ').map((w, i, a) => <span key={i}><span className="w" style={{ '--i': i } as React.CSSProperties}>{w}</span>{i < a.length - 1 ? ' ' : ''}</span>)}</h1>
            <p className="lede" {...K('hero', 'lede')}>{C.hero.lede}</p>
            <div className="acts plan-btns">
              <button type="button" className="btn ghost" data-plan="free" {...K('hero', 'free')}>{C.hero.free}</button>
              <button type="button" className="btn" data-plan="premium" {...K('hero', 'premium')}>{C.hero.premium}</button>
            </div>
          </div>
          <figure className="lens" data-lens="hero" aria-hidden="true">
            <div className="lens-stage"><canvas /><div className="lens-n"><b data-lens-n>{' '}</b><span>Entries</span></div><div className="lens-tip" hidden /></div>
            <ul className="legend">
              <li><i className="lg ring" aria-hidden="true" /><span {...K('featured', 'heading')}>{C.featured.heading}</span></li>
              {(['aspiring', 'inspired', 'luminary'] as const).map(t => <li key={t}><i className={`lg t-${t}`} aria-hidden="true" /><span>{tiers[t]}</span></li>)}
            </ul>
          </figure>
          <form className="console" role="search" aria-label="Choose what you want to search" noValidate>
            <Field k="what" />
            <span className="div" aria-hidden="true" />
            <Field k="where" />
            <button type="submit" className="btn go"><Ic sw="2" d={<><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /></>} /><span {...K('search', 'button')}>{C.search.button}</span></button>
            <p className="err" role="alert" hidden><span {...K('search', 'error')}>{C.search.error}</span></p>
          </form>
          <section className="benefits" aria-label="Global Directory benefits">
            {C.benefits.map((b, i) => <div className="bcol" key={i}><h2 {...K('benefits', i, 'title')}>{b.title}</h2><ul>{b.items.map((x, j) => <li key={j} {...K('benefits', i, 'items', j)}>{x}</li>)}</ul></div>)}
          </section>
          <div className="focus">
            <p className="focus-l" {...K('focus', 'label')}>{C.focus.label}</p>
            <ul>{C.focus.items.map((f, i) => <li key={f}><button type="button" className="fchip" data-focus={f}><span className="fi"><Ic d={FOCUS_IC[f]} /></span><span {...K('focus', 'items', i)}>{f}</span></button></li>)}</ul>
          </div>
        </div>
      </section>

      <section className="how" aria-labelledby="h-how">
        <div className="wrap">
          <h2 id="h-how" {...K('how', 'heading')}>{C.how.heading}</h2>
          <ol>{C.how.steps.map((s, i) => <li key={i}><span className="n" aria-hidden="true">0{i + 1}</span><h3 {...K('how', 'steps', i, 'title')}>{s.title}</h3><p {...K('how', 'steps', i, 'text')}>{s.text}</p></li>)}</ol>
        </div>
      </section>

      <div className="wrap">
        <details className="scope" data-preview>
          <summary><span className="dot" aria-hidden="true" /><b>{UI.scope.title}</b><span>{UI.scope.summary}</span><Ic sw="1.6" d={<path d="M12 5v14M5 12h14" />} /></summary>
          <div className="scope-b">{UI.scope.paragraphs.map((x, i) => <p key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</div>
        </details>
      </div>

      <section className="sec feat" id="featured-companies-section" aria-labelledby="h-feat">
        <div className="wrap">
          <div className="sec-h">
            <h2 id="h-feat" {...K('featured', 'heading')}>{C.featured.heading}</h2>
            <div className="sec-tools"><Filters inst="feat" />
              <div className="arrows">
                <button type="button" className="arw" data-step="-1" aria-label={C.featured.prev} {...K('featured', 'prev')}><Ic sw="1.8" d={<path d="M15 5l-7 7 7 7" />} /></button>
                <button type="button" className="arw" data-step="1" aria-label={C.featured.next} {...K('featured', 'next')}><Ic sw="1.8" d={<path d="M9 5l7 7-7 7" />} /></button>
              </div>
            </div>
          </div>
          <div className="frail" data-rail><ul className="cards track" data-featured aria-labelledby="h-feat" /></div>
          <p className="empty" data-feat-empty hidden />
          <div className="dots-row" data-dots />
        </div>
      </section>

      <section className="sec list" id="listed-companies-section" aria-labelledby="h-list">
        <div className="wrap">
          <div className="sec-h"><h2 id="h-list" {...K('listed', 'heading')}>{C.listed.heading}</h2></div>
          <div className="list-grid">
            <div className="side">
              <figure className="lens mini" data-lens="mini" aria-hidden="true"><div className="lens-stage"><canvas /><div className="lens-tip" hidden /></div></figure>
              <Filters inst="list" />
            </div>
            <div className="results">
              <div className="status"><p className="showing" data-showing /><button type="button" className="prov" data-prov aria-expanded="false" aria-controls="prov-note" hidden /><p className="prov-note" id="prov-note" hidden /></div>
              <ul className="cards grid" data-listed aria-labelledby="h-list" />
              <div className="state" data-state hidden />
              <nav className="pager" data-pager aria-label={C.pagination.navAria} hidden />
            </div>
          </div>
        </div>
      </section>

      <section className="sec faq" aria-labelledby="h-faq">
        <div className="wrap">
          <div className="faq-h"><h2 id="h-faq" {...K('faq', 'heading')}>{C.faq.heading}</h2><p {...K('faq', 'sub')}>{C.faq.sub}</p></div>
          <div className="faq-body">
            <div className="faq-tabs" role="tablist" aria-labelledby="h-faq">
              {C.faq.tabs.map((t, i) => <button key={i} type="button" role="tab" id={`faq-t${i}`} aria-controls={`faq-p${i}`} aria-selected={i === 0 ? 'true' : 'false'} tabIndex={i === 0 ? 0 : -1} {...K('faq', 'tabs', i, 'name')}>{t.name}</button>)}
            </div>
            <div className="faq-panels">
              {C.faq.tabs.map((t, i) => (
                <div className="faq-p" role="tabpanel" id={`faq-p${i}`} aria-labelledby={`faq-t${i}`} hidden={i !== 0} key={i}>
                  {t.items.map((it, j) => (
                    <div className="qa-i" key={j}>
                      <h3><button type="button" className="qa-q" aria-expanded="false" aria-controls={`faq-a${i}-${j}`} id={`faq-q${i}-${j}`}><span className="pm" aria-hidden="true" /><span {...K('faq', 'tabs', i, 'items', j, 'q')}>{it.q}</span></button></h3>
                      <div className="qa-a" id={`faq-a${i}-${j}`} role="region" aria-labelledby={`faq-q${i}-${j}`} hidden>
                        <div><p {...K('faq', 'tabs', i, 'items', j, 'a', 'lead')}>{it.a.lead}</p>{it.a.items.length > 0 && <ul>{it.a.items.map((x, k) => <li key={k} {...K('faq', 'tabs', i, 'items', j, 'a', 'items', k)}>{x}</li>)}</ul>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dawnband" aria-labelledby="h-cta">
        <div className="wrap"><div className="dawn-in">
          <div><h2 id="h-cta" {...K('cta', 'heading')}>{C.cta.heading}</h2><p {...K('cta', 'text')}>{C.cta.text}</p></div>
          <a className="btn dark" href={C.cta.url} data-prod-href={C.cta.url} target="_blank" rel="noopener"><span {...K('cta', 'button')}>{C.cta.button}</span> <Arrow /></a>
        </div></div>
      </section>
    </main>
  );
}

export function PlanDialog() {
  return (
    <dialog className="pdlg" id="plan-dialog" aria-labelledby="pd-title">
      <div className="pd-h">
        <h2 id="pd-title" {...K('plans', 'title')}>{C.plans.title}</h2>
        <p {...K('plans', 'lead')}>{C.plans.lead}</p>
        <button type="button" className="pd-x" data-close aria-label={UI.ui.close} data-ui><X /></button>
      </div>
      <div className="pd-b" tabIndex={0} role="region" aria-labelledby="pd-title">
        {C.plans.items.map(p => <PlanCard key={p.id} p={p} />)}
        <p className="pd-disc" {...K('plans', 'disclaimer')}>{C.plans.disclaimer}</p>
      </div>
      <div className="pd-f"><a className="btn" data-explore href={C.plans.destinations.free.signedOut} target="_blank" rel="noopener"><span {...K('plans', 'explore')}>{C.plans.explore}</span> <Arrow /></a></div>
    </dialog>
  );
}

/** Strings the script renders (cards, filter options, panels, pagination, states), as in the static page */
export const STRINGS = {
  search: C.search, focus: C.focus, filters: C.filters, pagination: C.pagination,
  card: Object.fromEntries((['bookmark', 'bookmarkTitle', 'ratingTitle', 'outOf5', 'globalRating', 'star', 'signIn', 'details', 'tiers', 'profile', 'login'] as const).map(k => [k, C.card[k]])),
  featured: C.featured, listed: C.listed, plans: { destinations: C.plans.destinations }, ui: UI.ui,
};
