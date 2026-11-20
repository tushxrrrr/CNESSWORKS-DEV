// C. Product Certification (content/product-certification.json): hero with the 108-place ring, the idea, the CNESS
// 108, seven pillars, why certify, the market evidence deck (behaviour in lib/certification/motion.ts), the journey
// and the closing daylight.
import { asset } from '@/lib/site';
import { Fragment } from 'react';
import { PRD } from '@/lib/certification/content';
import { fx } from '@/lib/certification/geometry';
import { Cta, k, linkProps, Sec, v, Words, type P } from './parts';
import { Bloom, Invite, Prod } from './Art';

const p: P = 'prd';
type Row = { value: string; label: string };
const num = (s: string) => parseFloat(s.replace(/%$/, ''));

/** One small chart per statistic; labels and values are tagged copy, the figure is hidden from assistive technology. */
function Chart({ i, rows }: { i: number; rows: Row[] }) {
  const t = (r: number, f: 'value' | 'label') => k(p, 'market', 'items', i, 'chart', r, f);
  if (i === 0) return ( // paired meters on a 0-100 scale
    <div className="ch ch-meters">{rows.map((x, r) => (
      <div className={r === 1 ? 'mr hi' : 'mr'} style={v({ '--v': fx(num(x.value) / 100, 3) })} key={r}><b className="mv" {...t(r, 'value')}>{x.value}</b><span className="ml" {...t(r, 'label')}>{x.label}</span><span className="mt"><i /></span></div>
    ))}<span className="axis"><i>0</i><i>50%</i><i>100%</i></span></div>
  );
  if (i === 1) return ( // columns: five-year compound annual growth
    <div className="ch ch-cols">{rows.map((x, r) => (
      <div className={r === 0 ? 'cc hi' : 'cc'} style={v({ '--v': fx(num(x.value) / 12, 3) })} key={r}><span className="cb"><i /><b className="mv" {...t(r, 'value')}>{x.value}</b></span><span className="ml" {...t(r, 'label')}>{x.label}</span></div>
    ))}</div>
  );
  if (i === 2) { // slope from a shared start
    const y = (n: number) => 56 - n / 32 * 50;
    return (
      <div className="ch ch-slope"><div className="sl"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><line className="base" x1="0" y1="56" x2="100" y2="56" vectorEffect="non-scaling-stroke" />
        <g className="rise">{rows.map((x, r) => <line className={r === 0 ? 'hi' : 'lo'} x1="0" y1="56" x2="100" y2={fx(y(num(x.value)), 2)} vectorEffect="non-scaling-stroke" key={r} />)}</g></svg>
        {rows.map((x, r) => <span className={r === 0 ? 'se hi' : 'se'} style={v({ '--y': `${fx(y(num(x.value)) / 60 * 100, 2)}%` })} key={r}><b className="mv" {...t(r, 'value')}>{x.value}</b><span className="ml" {...t(r, 'label')}>{x.label}</span></span>)}
      </div></div>
    );
  }
  const x = rows[0]!, n = Math.round(num(x.value));
  return (
    <div className={`ch ${i === 3 ? 'ch-dots' : 'ch-tiles'}`}><div className="grid100">{Array.from({ length: 100 }, (_, c) => <i className={c < n ? 'on' : undefined} style={v({ '--d': c % 10 + Math.floor(c / 10) })} key={c} />)}</div>
      <p className="gl"><b className="mv" {...t(0, 'value')}>{x.value}</b> <span className="ml" {...t(0, 'label')}>{x.label}</span></p></div>
  );
}

function Market() {
  const m = PRD.market, n = m.items.length;
  const Arrow = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return (
    <Sec id="prd-market" label={m.label} scene={5} side="l">
      <div className="wrap mkt">
        <div className="mkt-h" data-in=""><span className="k2" {...k(p, 'market', 'label')}>{m.label}</span><h2 className="h-md" {...k(p, 'market', 'h2')}>{m.h2}</h2><p className="lede" {...k(p, 'market', 'p')}>{m.p}</p></div>
        <div className="deck" data-in="" data-deck="" role="region" aria-roledescription="carousel" aria-label={m.h2}>
          <div className="deck-bar">
            <div className="deck-tabs" role="tablist" aria-label={m.label}>{m.tabs.map((t, i) => (
              <button type="button" role="tab" id={`mk-t${i}`} aria-controls={`mk-s${i}`} aria-selected={i === 0 ? 'true' : 'false'} tabIndex={i === 0 ? 0 : -1} key={i}><span className="tn" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span {...k(p, 'market', 'tabs', i)}>{t}</span></button>
            ))}</div>
            <div className="deck-arrows"><button type="button" className="da" data-step="-1" aria-label="Previous statistic" disabled><Arrow d="M15 5l-7 7 7 7" /></button><span className="dc" aria-hidden="true"><b>01</b> / {String(n).padStart(2, '0')}</span><button type="button" className="da" data-step="1" aria-label="Next statistic"><Arrow d="M9 5l7 7-7 7" /></button></div>
          </div>
          <div className="deck-view"><div className="deck-track" style={v({ '--n': n })}>{m.items.map((x, i) => (
            <div className={i === 0 ? 'mslide on' : 'mslide'} id={`mk-s${i}`} role="tabpanel" aria-roledescription="slide" aria-labelledby={`mk-t${i}`} inert={i !== 0} key={i}>
              <div className="st"><p className="big" {...k(p, 'market', 'items', i, 'value')}>{x.value}</p><p className="sti" {...k(p, 'market', 'items', i, 'title')}>{x.title}</p><p className="std" {...k(p, 'market', 'items', i, 'detail')}>{x.detail}</p></div>
              <div className="sv" aria-hidden="true"><Chart i={i} rows={x.chart} /></div>
              <p className="src"><span className="srl">Source</span> <a {...linkProps(x.source.url)} {...k(p, 'market', 'items', i, 'source')}>{x.source.text}</a></p>
            </div>
          ))}</div></div>
          <div className="deck-prog" aria-hidden="true"><i style={v({ '--p': fx(1 / n, 4) })} /></div>
          <p className="sr" aria-live="polite" data-deck-status="" />
        </div>
        <p className="note mkt-note" {...k(p, 'market', 'note')}>{m.note}</p>
      </div>
    </Sec>
  );
}

export default function ProductPage() {
  const h = PRD.hero, i_ = PRD.idea, f = PRD.founding, ev = PRD.evaluate, wy = PRD.why, j = PRD.journey, pw = PRD.pathways;
  return (
    <>
      <section className="pg-hero p-hero" id="prd-top" data-scene="0" aria-labelledby="h-prd">
        <div className="wrap stage"><div className="txt">
          <span className="chip" {...k(p, 'hero', 'eyebrow')}>{h.eyebrow}</span>
          <h1 id="h-prd" className="h-lg" tabIndex={-1}>{h.h1.map((line, n) => <Fragment key={n}>{n ? ' ' : null}<span className={n === 1 ? 'ln g2' : 'ln'} {...k(p, 'hero', 'h1', n)}><Words text={line} /></span></Fragment>)}</h1>
          <p className="tg" {...k(p, 'hero', 'tagline')}>{h.tagline}</p>
          <p className="lede" {...k(p, 'hero', 'p')}>{h.p}</p>
          <div className="acts"><Cta page={p} path={['hero', 'ctas', 0]} l={h.ctas[0]!} /><Cta page={p} path={['hero', 'ctas', 1]} l={h.ctas[1]!} cls="btn ghost" /></div>
          <div className="c108"><span className="v" {...k(p, 'hero', 'stat', 'value')}>{h.stat.value}</span><span className="t" {...k(p, 'hero', 'stat', 'title')}>{h.stat.title}</span><span className="d" {...k(p, 'hero', 'stat', 'desc')}>{h.stat.desc}</span></div>
        </div><Prod /></div>
      </section>
      <Sec id="prd-idea" label={i_.label} scene={1} side="l">
        <div className="wrap">
          <div className="stage c"><div className="txt" data-in=""><span className="k2" {...k(p, 'idea', 'label')}>{i_.label}</span><h2 className="h-lg" {...k(p, 'idea', 'h2')}>{i_.h2}</h2></div></div>
          <div className="idea" data-in=""><p className="first" {...k(p, 'idea', 'p', 0)}>{i_.p[0]}</p><div className="rest">{i_.p.slice(1).map((x, n) => <p key={n} {...k(p, 'idea', 'p', n + 1)}>{x}</p>)}</div></div>
        </div>
      </Sec>
      <Sec id="prd-founding" label={f.h2} scene={2} side="r">
        <div className="wrap">
          <div className="stage"><div className="txt" data-in=""><h2 className="k2" {...k(p, 'founding', 'h2')}>{f.h2}</h2><h3 className="h-md" {...k(p, 'founding', 'h3')}>{f.h3}</h3>
            <p className="lede"><span {...k(p, 'founding', 'p', 0)}>{f.p[0]}</span><br /><span {...k(p, 'founding', 'p', 1)}>{f.p[1]}</span></p></div><Invite mark="108" /></div>
          <div className="found" data-in=""><div className="glass ticks2">{f.lists.map((l, a) => <ul key={a}>{l.map((x, b) => <li key={b} {...k(p, 'founding', 'lists', a, b)}>{x}</li>)}</ul>)}</div><p className="note" {...k(p, 'founding', 'note')}>{f.note}</p><div className="acts"><Cta page={p} path={['founding', 'cta']} l={f.cta} /></div></div>
        </div>
      </Sec>
      <Sec id="prd-evaluate" label={ev.h3} scene={3} side="l">
        <div className="wrap">
          <div className="stage l"><Bloom ns={ev.pillars.map(x => x.n)} /><div className="txt" data-in=""><h2 className="k2" {...k(p, 'evaluate', 'h2')}>{ev.h2}</h2><h3 className="h-lg" {...k(p, 'evaluate', 'h3')}>{ev.h3}</h3><p className="lede" {...k(p, 'evaluate', 'p')}>{ev.p}</p></div></div>
          <ul className="p7" data-in="">{ev.pillars.map((x, n) => <li data-pillar={n} key={n}><span className="n" {...k(p, 'evaluate', 'pillars', n, 'n')}>{x.n}</span><span className="t" {...k(p, 'evaluate', 'pillars', n, 'title')}>{x.title}</span><p className="d" {...k(p, 'evaluate', 'pillars', n, 'desc')}>{x.desc}</p></li>)}<li className="total"><span {...k(p, 'evaluate', 'total')}>{ev.total}</span></li></ul>
        </div>
      </Sec>
      <Sec id="prd-why" label={wy.h2} scene={4} side="r">
        <div className="wrap whyp">
          <div style={{ display: 'grid', gap: '1rem' }} data-in=""><h2 className="k2" {...k(p, 'why', 'h2')}>{wy.h2}</h2><h3 className="h-md" {...k(p, 'why', 'h3')}>{wy.h3}</h3></div>
          <div className="glass pad" data-in=""><p className="q" {...k(p, 'why', 'p')}>{wy.p}</p></div>
        </div>
      </Sec>
      <Market />
      <Sec id="prd-journey" label={j.h2} scene={6} side="r">
        <div className="wrap journey">
          <div data-in=""><h2 className="h-md" {...k(p, 'journey', 'h2')}>{j.h2}</h2></div>
          <div data-in=""><ol className="j7" data-fill="">{j.steps.map((s, n) => <li data-stepi={n} key={n}><span {...k(p, 'journey', 'steps', n)}>{s}</span></li>)}<li className="run" aria-hidden="true" /></ol>
            <p className="one" {...k(p, 'journey', 'p')}>{j.p}</p></div>
        </div>
      </Sec>
      <Sec id="prd-pathways" label={pw.h2} scene={7} cls="dawn final">
        <div className="sunrise"><div className="in">
          <img className="mk" src={asset('assets/cness-mark.svg')} width={64} height={64} alt="" loading="lazy" decoding="async" />
          <p className="k2" {...k(p, 'pathways', 'h2')}>{pw.h2}</p><h2 {...k(p, 'pathways', 'h3')}>{pw.h3}</h2>
          <p {...k(p, 'pathways', 'p', 0)}>{pw.p[0]}</p><p {...k(p, 'pathways', 'p', 1)}>{pw.p[1]}</p><p className="motto" {...k(p, 'pathways', 'p', 2)}>{pw.p[2]}</p>
          <div className="acts"><Cta page={p} path={['pathways', 'ctas', 0]} l={pw.ctas[0]!} cls="btn dark" /><a className="btn line-dark" {...linkProps(pw.ctas[1]!.url)} {...k(p, 'pathways', 'ctas', 1)}>{pw.ctas[1]!.text}</a></div>
        </div></div>
      </Sec>
    </>
  );
}
