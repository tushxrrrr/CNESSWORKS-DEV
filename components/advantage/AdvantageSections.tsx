// CNESS Advantage page body: hero with the page index, offerings (the three levels share one rail), statement
// lines, plans, SuperApp and the closing daylight. Server-rendered, same markup as the approved static page
// (src/advantage.html); every approved string carries data-c="<type>" for tools/verify-advantage.js.
// Headline and statement words are pre-split into spans here (the static page splits them in script), so the
// browser never re-writes React's markup.
import { appPath, asset } from '@/lib/site';
import { Fragment, type CSSProperties } from 'react';
import { ADVANTAGE, type Block, type Link, type Offering, type PlanCard } from '@/lib/advantage/model';
import { Icon } from './Icons';

const Arr = () => <span className="arr" aria-hidden="true">→</span>;
// Calls to action: pages this app serves open in the app, the rest open the live site in a new tab
const out = (url: string) => { const local = appPath(url); return local ? { href: local, 'data-prod-href': url } : { href: url, 'data-prod-href': url, target: '_blank', rel: 'noopener' }; };
const Cta = ({ l, cls = 'btn' }: { l: Link; cls?: string }) => (
  <a className={cls} data-c="a" {...out(l.url)}>{l.text} <Arr /></a>
);
const v = (o: Record<string, string | number>) => o as CSSProperties;

// Words as spans, spaces kept as text between them; `gold` marks words set in the gold italic.
function Words({ text, cls, gold, start = 0 }: { text: string; cls: string; gold?: string; start?: number }) {
  return <>{text.split(' ').map((w, i) => {
    const s = <span className={cls} style={cls === 'w' ? v({ '--i': start + i }) : undefined}>{w}</span>;
    return <Fragment key={i}>{i ? ' ' : null}{w === gold ? <span className="g">{s}</span> : s}</Fragment>;
  })}</>;
}

function Hero() {
  const h = ADVANTAGE.hero;
  return (
    <section className="hero" id="advantage" data-scene="0" data-name={h.eyebrow} aria-labelledby="h-hero">
      <div className="wrap inner">
        <span className="tag" data-c="eyebrow">{h.eyebrow}</span>
        <h1 id="h-hero" data-c="h1" data-words=""><Words text={h.h1} cls="w" gold="care" /></h1>
        <p className="lede" data-c="p">{h.lede}</p>
        <p className="start" data-c="p">{h.start}</p>
        <nav aria-label="On this page"><ul className="idx">{ADVANTAGE.index.map(x => (
          <li key={x.id}><a href={`#${x.id}`}><span className="k">{x.k}</span><span className="t">{x.t}</span></a></li>
        ))}</ul></nav>
      </div>
    </section>
  );
}

function OfferingSection({ o }: { o: Offering }) {
  return (
    <section className={o.flip ? 'off flip' : 'off'} id={o.id} data-scene={o.scene} data-hi={o.hi} data-name={o.eyebrow} aria-labelledby={`h-${o.id}`}>
      <div className="wrap">
        <div className="intro"><div className="txt" data-in="">
          {o.emblem && <img className="emb" src={asset(`assets/emblem-${o.emblem}.svg`)} width={76} height={76} alt="" loading="lazy" decoding="async" />}
          <span className="tag" data-c="eyebrow">{o.eyebrow}</span>
          <h3 id={`h-${o.id}`} data-c="h3">{o.h3}</h3>
          <p className="desc" data-c="p">{o.desc}</p>
          <div className="acts"><Cta l={o.cta} /></div>
        </div></div>
        <div className="det" data-in="">
          <div className="cols">{o.cols.map(c => (
            <div className="col" key={c.label}><p className="lbl" data-c="label">{c.label}</p><ul>{c.items.map(t => <li data-c="li" key={t}>{t}</li>)}</ul></div>
          ))}</div>
          <div className={o.use ? 'means' : 'means solo'}>
            <div className="m"><p className="lbl" data-c="label">{o.means.label}</p><p className="q" data-c="means">{o.means.text}</p></div>
            {o.use && <div className="use"><span className="ic"><Icon name={o.icon} /></span><h4 data-c="h4">{o.use.h4}</h4><p data-c="p">{o.use.p}</p></div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Plan({ p, k, pro, badge }: { p: PlanCard; k: number; pro?: boolean; badge?: string }) {
  return (
    <article className={pro ? 'plan pro' : 'plan'} data-plan={k} aria-labelledby={`h-plan-${k}`}>
      {badge && <span className="badge" data-c="badge">{badge}</span>}
      <h3 id={`h-plan-${k}`} data-c="h3">{p.name}</h3>
      <p className="sum" data-c="p">{p.summary}</p>
      <ul>{p.rows.map((r, i) => (
        <li data-c="li" className={r.cap ? 'cap' : undefined} key={i}><Icon name={r.cap ? 'minus' : 'check'} /><span>{r.lead ? <><b>{r.lead}</b> — {r.text}</> : r.text}</span></li>
      ))}</ul>
      <Cta l={p.cta} cls={pro ? 'btn' : 'btn ghost'} />
    </article>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case 'offering': return <OfferingSection o={b} />;
    case 'levels': return (
      <div className="levels" id="levels"><div className="rail" aria-hidden="true"><i /></div>{b.items.map((x, i) => <BlockView b={x} key={i} />)}</div>
    );
    case 'statement': return (
      <section className="say" aria-label={b.text}><div className="wrap"><h2 data-c="h2" data-say=""><Words text={b.text} cls="wd" /></h2></div></section>
    );
    case 'plans': return (
      <section className="plans-s" id="plans" data-scene="6" data-name={b.h2} aria-labelledby="h-plans">
        <div className="wrap">
          <div className="plans-h" data-in=""><h2 id="h-plans" data-c="h2">{b.h2}</h2><p className="lede" data-c="p">{b.intro}</p></div>
          <div className="plans" data-in=""><Plan p={b.free} k={0} /><Plan p={b.pro} k={1} pro badge={b.badge} /></div>
          <p className="same" data-c="p" data-in=""><Icon name="scale" /><span><strong>{b.noteLead}</strong> {b.noteRest}</span></p>
        </div>
      </section>
    );
    case 'superapp': return (
      <section className="app" id="superapp" data-scene="9" data-name="CNESS SuperApp" aria-labelledby="h-app">
        <div className="wrap">
          <div className="app-h" data-in=""><h2 id="h-app" data-c="h2">{b.h2}</h2><p className="lede" data-c="p">{b.intro}</p></div>
          <ul className="ways" data-in="">{b.ways.map((w, k) => (
            <li className="way" data-way={k} key={k}><span className="ic"><Icon name={w.icon} /></span><h3 data-c="h3">{w.title}</h3><p data-c="p">{w.text}</p></li>
          ))}</ul>
          <div className="acts"><Cta l={b.cta} /></div>
        </div>
      </section>
    );
    case 'final': return (
      <section className="final" id="start" data-scene="10" data-name={b.h2} aria-labelledby="h-start">
        <div className="sunrise"><div className="in">
          <img className="mk" src={asset('assets/cness-mark.svg')} width={64} height={64} alt="" loading="lazy" decoding="async" />
          <h2 id="h-start" data-c="h2">{b.h2}</h2>
          <p data-c="p">{b.p}</p>
          <div className="acts"><Cta l={b.primary} cls="btn dark" /><a className="btn line-dark" data-c="a" {...out(b.secondary.url)}>{b.secondary.text}</a></div>
        </div></div>
      </section>
    );
  }
}

export function SectionDots() {
  return (
    <nav aria-label="Sections"><ul className="dots" id="dots">{ADVANTAGE.dots.map(d => (
      <li key={d.id}><a href={`#${d.id}`}><span>{d.name}</span></a></li>
    ))}</ul></nav>
  );
}

export default function AdvantageSections() {
  return (
    <main id="main">
      <Hero />
      {ADVANTAGE.blocks.map((b, i) => <BlockView b={b} key={i} />)}
    </main>
  );
}
