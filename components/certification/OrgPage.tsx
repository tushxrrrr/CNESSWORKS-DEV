// B. Organization Certification (content/cness-certification.json): hero with pillar chips and stats, community
// logos, why chart, the six pillars with their dialogs, benefits, how-it-works steps, spotlight testimonials,
// levels and FAQ tabs, then the closing daylight. Behaviour lives in lib/certification/motion.ts.
import { asset } from '@/lib/site';
import { Fragment } from 'react';
import { ORG } from '@/lib/certification/content';
import { Arr, Cta, I, k, linkProps, Sec, v, Words, type P } from './parts';
import { Temple, Wheel } from './Art';

const p: P = 'org';
const dash = (s: string) => s.replace(/-/g, '–');

export default function OrgPage() {
  const h = ORG.hero, cm = ORG.community, w = ORG.why, ev = ORG.evaluate, bn = ORG.benefits, hw = ORG.how, sp = ORG.spotlight, lv = ORG.levels, fq = ORG.faq, bg = ORG.begin;
  const titles = ev.pillars.map(x => dash(x.title));
  // hero chip -> the matching pillar in the Evaluate section (opens its details)
  const evIndex = (r: string[]) => { const lab = dash(`${r[0]} ${r[1]}`); return titles.findIndex(t => t.startsWith(lab.split(' &')[0]!) || t === lab); };
  type Level = typeof lv.items[number];
  const lcard = (i: number, x: Level, cls = '') => (
    <article className={`lvc${cls}`} data-level={i} key={i}><img className="em" src={asset(`assets/emblem-${x.emblem}.svg`)} width={64} height={64} alt="" loading="lazy" decoding="async" />
      <span className="tier" {...k(p, 'levels', 'items', i, 'tier')}>{x.tier}</span><h3 {...k(p, 'levels', 'items', i, 'name')}>{x.name}</h3><p className="tg" {...k(p, 'levels', 'items', i, 'tagline')}>{x.tagline}</p>
      <div style={{ display: 'grid', gap: '.9rem', alignContent: 'start' }}><h4 {...k(p, 'levels', 'items', i, 'showsLabel')}>{x.showsLabel}</h4><ul>{x.shows.map((s, j) => <li key={j} {...k(p, 'levels', 'items', i, 'shows', j)}>{s}</li>)}</ul>
        <h4 {...k(p, 'levels', 'items', i, 'advLabel')}>{x.advLabel}</h4><ul className="adv">{x.advantages.map((s, j) => <li key={j} {...k(p, 'levels', 'items', i, 'advantages', j)}>{s}</li>)}</ul></div>
      <p className="prog" {...k(p, 'levels', 'items', i, 'progress')}><b>{x.progressEmphasis}</b>{x.progress.slice(x.progressEmphasis.length)}</p></article>
  );
  return (
    <>
      <section className="pg-hero org-hero" id="org-top" data-scene="0" aria-labelledby="h-org">
        <div className="wrap stage">
          <div className="txt">
            <h1 id="h-org" className="h-lg" tabIndex={-1} {...k(p, 'hero', 'h1')}><Words text={h.h1} /></h1>
            <p className="lede" {...k(p, 'hero', 'p')}>{h.p}</p>
            <div className="acts"><Cta page={p} path={['hero', 'cta']} l={h.cta} /><a className="glimpse" href="#org-benefits"><i aria-hidden="true" /><span {...k(p, 'hero', 'glimpse')}>{h.glimpse}</span></a></div>
          </div>
          <div className="ringbox"><Temple /><ul className="ring" aria-label={ev.label}>{h.ring.map((r, i) => (
            <li key={i}><button type="button" className="chip6" data-col={i} data-open-pillar={evIndex(r)} aria-haspopup="dialog"><span {...k(p, 'hero', 'ring', i, 0)}>{r[0]}</span> <span {...k(p, 'hero', 'ring', i, 1)}>{r[1]}</span></button></li>
          ))}</ul></div>
        </div>
        <div className="wrap" style={{ marginTop: 'clamp(1.5rem,4vh,2.5rem)' }}><div className="stats" data-in="">{h.stats.map((s, i) => (
          <div className="stat" key={i}><span className="v" {...k(p, 'hero', 'stats', i, 'value')}>{s.value}</span><span className="t">{s.title.map((t, j) => <Fragment key={j}>{j ? ' ' : null}<span {...k(p, 'hero', 'stats', i, 'title', j)}>{t}</span></Fragment>)}</span><p className="d" {...k(p, 'hero', 'stats', i, 'desc')}>{s.desc}</p><p className="src"><b>Source</b>: <span {...k(p, 'hero', 'stats', i, 'source')}>{s.source}</span></p></div>
        ))}</div></div>
      </section>
      <Sec id="org-community" label={cm.h2} scene={1}>
        <div className="wrap"><div className="glass pad" data-in="">
          <div className="comm-h"><h2 {...k(p, 'community', 'h2')}>{cm.h2}</h2><a className="btn ghost sm" {...linkProps(cm.explore.url)} {...k(p, 'community', 'explore')}>{cm.explore.text} <Arr /></a></div>
          <ul className="logos">{cm.logos.map((l, i) => <li key={i}><a {...linkProps(l.url)} {...k(p, 'community', 'logos', i, 'url')} aria-label={l.name}><img src={asset(l.img)} alt="" loading="lazy" decoding="async" /></a></li>)}</ul></div></div>
      </Sec>
      <Sec id="org-why" label={w.kicker} scene={2} side="l">
        <div className="wrap why">
          <div className="txt" style={{ display: 'grid', gap: '1.1rem' }} data-in=""><h3 className="kick" {...k(p, 'why', 'kicker')}>{w.kicker}</h3>
            <p className="hd"><span {...k(p, 'why', 'heading', 0)}>{w.heading[0]}</span> <span {...k(p, 'why', 'heading', 1)}>{w.heading[1]}</span></p>
            <p className="lede" {...k(p, 'why', 'p')}>{w.p}</p></div>
          <figure className="glass bars" data-bars="" data-in="" style={{ margin: 0 }}>{w.chart.map((b, i) => (
            <div className={i ? 'cbar un' : 'cbar'} style={v({ '--h': parseInt(b.value) })} key={i}><span className="lab" {...k(p, 'why', 'chart', i, 'label')}>{b.label}</span><span className="val" {...k(p, 'why', 'chart', i, 'value')}>{b.value}</span><span className="col" aria-hidden="true" /></div>
          ))}</figure>
        </div>
      </Sec>
      <Sec id="org-evaluate" label={ev.label} scene={3} side="r">
        <div className="wrap">
          <div className="stage"><div className="txt" data-in=""><h2 className="k2" {...k(p, 'evaluate', 'h2')}>{ev.h2}</h2><h3 className="h-md" {...k(p, 'evaluate', 'h3')}>{ev.h3}</h3><p className="tag" {...k(p, 'evaluate', 'label')}>{ev.label}</p></div><Wheel ns={ev.pillars.map(x => x.n)} /></div>
          <ul className="pill6" data-in="">{ev.pillars.map((x, i) => { const d = x.dialog; return (
            <li key={i}><button className="pbtn" type="button" data-open={`pd-${i}`} data-pillar={i} aria-haspopup="dialog"><span className="n" {...k(p, 'evaluate', 'pillars', i, 'n')}>{x.n}</span><span className="t" {...k(p, 'evaluate', 'pillars', i, 'title')}>{x.title}</span><span className="s" {...k(p, 'evaluate', 'pillars', i, 'subtitle')}>{x.subtitle}</span><span className="more" aria-hidden="true"><Arr /></span></button>
              <dialog className="pd" id={`pd-${i}`} aria-labelledby={`pd-${i}-h`}><div className="in">
                <header><span className="k2">{x.n} / 06</span><h2 id={`pd-${i}-h`} {...k(p, 'evaluate', 'pillars', i, 'dialog', 'title')}>{d.title}</h2><p className="sub" {...k(p, 'evaluate', 'pillars', i, 'dialog', 'subtitle')}>{d.subtitle}</p></header>
                <div className="body" tabIndex={0}><p {...k(p, 'evaluate', 'pillars', i, 'dialog', 'description')}>{d.description}</p><ol>{d.points.map((pt, j) => <li key={j} {...k(p, 'evaluate', 'pillars', i, 'dialog', 'points', j)}>{pt}</li>)}</ol></div>
                <footer><span className="cnt">{x.n} / 06</span><button className="icb" type="button" data-step="-1" aria-label={ev.dialogControls.prev}>{I.prev}</button><button className="icb" type="button" data-step="1" aria-label={ev.dialogControls.next}>{I.next}</button><button className="btn ghost sm" type="button" data-close="">{ev.dialogControls.close}</button></footer>
              </div></dialog></li>
          ); })}</ul>
        </div>
      </Sec>
      <Sec id="org-benefits" label={bn.h2} scene={4}>
        <div className="wrap">
          <div className="ben-head" data-in=""><div style={{ display: 'grid', gap: '1rem' }}><h2 className="k2" {...k(p, 'benefits', 'h2')}>{bn.h2}</h2><p className="hd">{bn.heading.map((t, j) => <Fragment key={j}>{j ? ' ' : null}<span {...k(p, 'benefits', 'heading', j)}>{t}</span></Fragment>)}</p></div><p className="lede" {...k(p, 'benefits', 'p')}>{bn.p}</p></div>
          <div className="stats" style={{ marginTop: '1.6rem' }} data-in="">{bn.stats.map((s, i) => (
            <div className="stat" key={i}><span className="v" {...k(p, 'benefits', 'stats', i, 'value')}>{s.value}</span><span className="t" {...k(p, 'benefits', 'stats', i, 'title')}>{s.title}</span><p className="d" {...k(p, 'benefits', 'stats', i, 'desc')}>{s.desc}</p><p className="src"><b>Source</b>: <span {...k(p, 'benefits', 'stats', i, 'source')}>{s.source}</span></p></div>
          ))}</div>
          <p className="tag" style={{ marginTop: '2.2rem' }} {...k(p, 'benefits', 'label')}>{bn.label}</p>
          <ul className="ben4" data-in="">{bn.items.map((b, i) => <li key={i}><span className="n" {...k(p, 'benefits', 'items', i, 'n')}>{b.n}</span><span className="t" {...k(p, 'benefits', 'items', i, 'title')}>{b.title}</span><p className="d" {...k(p, 'benefits', 'items', i, 'desc')}>{b.desc}</p></li>)}</ul>
        </div>
      </Sec>
      <Sec id="org-how" label={hw.h2} scene={5} side="l">
        <div className="wrap">
          <div className="stage c"><div className="txt" data-in=""><h2 className="k2" {...k(p, 'how', 'h2')}>{hw.h2}</h2><h3 className="h-md" {...k(p, 'how', 'h3')}>{hw.h3}</h3></div></div>
          <ol className="steps5" data-fill="">{hw.steps.map((s, i) => <li data-stepi={i} key={i}><span className="n" {...k(p, 'how', 'steps', i, 'n')}>{s.n}</span><span className="t" {...k(p, 'how', 'steps', i, 'title')}>{s.title}</span><p className="d" {...k(p, 'how', 'steps', i, 'desc')}>{s.desc}</p></li>)}<li className="run" aria-hidden="true" /></ol>
          <div className="acts" style={{ marginTop: '2rem' }}><Cta page={p} path={['how', 'ctas', 0]} l={hw.ctas[0]!} cls="btn desk-only" /><Cta page={p} path={['how', 'ctas', 1]} l={hw.ctas[1]!} cls="btn ghost" /></div>
        </div>
      </Sec>
      <Sec id="org-spotlight" label={sp.h2[0]!} scene={6}>
        <div className="wrap spot">
          <div className="txt" style={{ display: 'grid', gap: '1.1rem' }} data-in=""><h2 className="h-md"><span {...k(p, 'spotlight', 'h2', 0)}>{sp.h2[0]}</span> <span className="g" {...k(p, 'spotlight', 'h2', 1)}>{sp.h2[1]}</span></h2><p className="lede" {...k(p, 'spotlight', 'p')}>{sp.p}</p></div>
          <div className="glass pad" data-in=""><div className="car" aria-roledescription="carousel" aria-label={`${sp.h2[0]} ${sp.h2[1]}`}>{sp.items.map((t, i) => (
            <figure className="slide" id={`sl-${i}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${sp.items.length}`} aria-hidden={i === 0 ? 'false' : 'true'} key={i}><div className="ph"><img src={asset(t.img)} alt={t.name} loading="lazy" decoding="async" /></div><div><figcaption><b {...k(p, 'spotlight', 'items', i, 'name')}>{t.name}</b><span {...k(p, 'spotlight', 'items', i, 'role')}>{t.role}</span></figcaption><blockquote {...k(p, 'spotlight', 'items', i, 'quote')}>{t.quote}</blockquote></div></figure>
          ))}</div>
            <div className="car-ctl"><span className="dots2" aria-hidden="true"><i className="on" /><i /></span><button className="icb" type="button" data-car="-1" aria-label={sp.controls.prev}>{I.prev}</button><button className="icb" type="button" data-car="1" aria-label={sp.controls.next}>{I.next}</button></div></div>
        </div>
      </Sec>
      <Sec id="org-levels" label={lv.h2} scene={7}>
        <div className="wrap">
          <div className="stage c"><div className="txt" data-in=""><h2 className="h-lg" {...k(p, 'levels', 'h2')}>{lv.h2}</h2><p className="lede" {...k(p, 'levels', 'p')}>{lv.p}</p></div></div>
          <div className="lv5">{lv.items.slice(0, 3).map((x, i) => lcard(i, x))}</div>
          <div className="layers">{lv.items.slice(3).map((x, i) => lcard(i + 3, x, ' layer'))}</div>
        </div>
      </Sec>
      <Sec id="org-faq" label={fq.h3} scene={8} side="r">
        <div className="wrap"><div style={{ maxWidth: '60rem' }}>
          <h3 className="h-md" {...k(p, 'faq', 'h3')}>{fq.h3}</h3><p className="lede" style={{ marginTop: '1rem' }} {...k(p, 'faq', 'p')}>{fq.p}</p>
          <div className="faq-t" role="tablist" aria-label={fq.h3}>{fq.tabs.map((t, i) => (
            <button type="button" role="tab" id={`ft-${i}`} aria-controls={`fp-${i}`} aria-selected={i === 0 ? 'true' : 'false'} tabIndex={i === 0 ? 0 : -1} key={i} {...k(p, 'faq', 'tabs', i, 'name')}>{t.name}</button>
          ))}</div>
          {fq.tabs.map((t, i) => (
            <div className="faq-p" role="tabpanel" id={`fp-${i}`} aria-labelledby={`ft-${i}`} hidden={i !== 0} key={i}>{t.items.map((x, j) => (
              <details key={j}><summary><span {...k(p, 'faq', 'tabs', i, 'items', j, 'q')}>{x.q}</span><i aria-hidden="true" /></summary><p className="a" {...k(p, 'faq', 'tabs', i, 'items', j, 'a')}>{x.a}</p></details>
            ))}</div>
          ))}
        </div></div>
      </Sec>
      <Sec id="org-begin" label={bg.h3} scene={9} cls="dawn final">
        <div className="sunrise"><div className="in">
          <img className="mk" src={asset('assets/cness-mark.svg')} width={64} height={64} alt="" loading="lazy" decoding="async" />
          <h3 className="h-lg" {...k(p, 'begin', 'h3')}>{bg.h3}</h3><p {...k(p, 'begin', 'p')}>{bg.p}</p>
          <div className="acts"><Cta page={p} path={['begin', 'cta']} l={bg.cta} cls="btn dark" /></div>
        </div></div>
      </Sec>
    </>
  );
}
