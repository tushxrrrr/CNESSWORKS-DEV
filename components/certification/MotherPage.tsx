// A. Mother of Certification (content/mother-of-certification.json): hero with the canopy, industry table with
// region filters, search and Show more (behaviour in lib/certification/motion.ts), the compare pair, two cards
// and the closing daylight.
import { MOC } from '@/lib/certification/content';
import { Arr, Cta, I, k, linkProps, Sec, Words, type P } from './parts';
import { Canopy, Join, WorldMap } from './Art';

const p: P = 'moc';

export default function MotherPage() {
  const h = MOC.hero, ind = MOC.industry, c = MOC.closing;
  return (
    <>
      <section className="pg-hero moc-hero" id="moc-top" data-scene="0" aria-labelledby="h-moc">
        <div className="wrap stage"><div className="txt">
          <div className="crumbs"><span className="tag" {...k(p, 'hero', 'eyebrow')}>{h.eyebrow}</span><span className="chip" {...k(p, 'hero', 'label')}>{h.label}</span></div>
          <h1 id="h-moc" className="h-lg" tabIndex={-1} {...k(p, 'hero', 'h1')}><Words text={h.h1} /></h1>
          <p className="lede" {...k(p, 'hero', 'p', 0)}>{h.p[0]}</p>
          <p className="note lede-pearl" {...k(p, 'hero', 'p', 1)}>{h.p[1]}</p>
        </div><Canopy /></div>
      </section>
      <Sec id="moc-industry" label={ind.label} scene={1} side="r">
        <div className="wrap">
          <div className="moc-ind">
            <figure className="fig" data-in=""><img src={ind.image.src} width={960} height={639} alt={ind.image.alt} loading="lazy" decoding="async" /></figure>
            <div className="txt" style={{ display: 'grid', gap: '1.1rem' }} data-in="">
              <span className="k2" {...k(p, 'industry', 'label')}>{ind.label}</span>
              <h2 className="h-md" {...k(p, 'industry', 'h2')}>{ind.h2}</h2>
              <p className="lede" {...k(p, 'industry', 'p')}>{ind.p}</p>
              <div className="acts"><Cta page={p} path={['industry', 'ctas', 0]} l={ind.ctas[0]!} /><Cta page={p} path={['industry', 'ctas', 1]} l={ind.ctas[1]!} cls="btn ghost" /></div>
            </div>
          </div>
          <div className="tbl-wrap" id="moc-table">
            <WorldMap />
            <div className="tools">
              <label className="search"><span className="sr">{ind.search.placeholder}</span>{I.search}<input type="search" id="moc-q" placeholder={ind.search.placeholder} autoComplete="off" aria-controls="moc-tbl" /></label>
              <div className="seg" role="group" aria-label={ind.columns[0]}>{ind.filters.map((f, i) => (
                <button type="button" aria-pressed={i === 0 ? 'true' : 'false'} data-f={f} key={f} {...k(p, 'industry', 'filters', i)}>{f}</button>
              ))}</div>
            </div>
            <div className="tbl" id="moc-tbl" role="region" aria-label={ind.h2} tabIndex={0}>
              <table><thead><tr>{ind.columns.map((col, j) => <th scope="col" key={j} {...k(p, 'industry', 'columns', j)}>{col}</th>)}</tr></thead>
                <tbody>{ind.rows.map((r, i) => (
                  <tr data-r={r[0]} data-q={r.slice(1).join(' ').toLowerCase()} key={i}>
                    <th scope="row" {...k(p, 'industry', 'rows', i, 0)}>{r[0]}</th>
                    {r.slice(1, -1).map((cell, j) => <td key={j} {...k(p, 'industry', 'rows', i, j + 1)}>{cell}</td>)}
                    <td className="lvl" data-l={r[5]}><span {...k(p, 'industry', 'rows', i, 5)}>{r[5]}</span></td>
                  </tr>
                ))}<tr className="empty" hidden><td colSpan={6} {...k(p, 'industry', 'empty')}>{ind.empty}</td></tr></tbody></table>
            </div>
            <p className="sr" id="moc-count" aria-live="polite" />
            <div className="tbl-foot"><button className="btn ghost" type="button" id="moc-more" aria-controls="moc-tbl" aria-expanded="false" data-more={ind.more} data-less={ind.less} {...k(p, 'industry', 'more')}>{ind.more}</button></div>
          </div>
        </div>
      </Sec>
      <Sec id="moc-compare" label={MOC.compare[0]!.label} scene={2}>
        <div className="wrap"><Join labels={['9001', 'B']} /><div className="duo">{MOC.compare.map((cm, i) => (
          <article className="glass pad cmp" data-in="" data-big={i === 0 ? '9001' : 'B'} key={i}>
            <span className="k2" {...k(p, 'compare', i, 'label')}>{cm.label}</span><h3 {...k(p, 'compare', i, 'h3')}>{cm.h3}</h3>
            <p {...k(p, 'compare', i, 'p', 0)}>{cm.p[0]}</p><p {...k(p, 'compare', i, 'p', 1)}>{cm.p[1]}</p></article>
        ))}</div></div>
      </Sec>
      <Sec id="moc-cards" label={MOC.cards[0]!.h3} scene={3}>
        <div className="wrap"><div className="duo" data-in="">{MOC.cards.map((cd, i) => (
          <a className="glass pad lcard" {...linkProps(cd.url)} {...k(p, 'cards', i, 'url')} key={i}><h3 {...k(p, 'cards', i, 'h3')}>{cd.h3}</h3><p {...k(p, 'cards', i, 'p')}>{cd.p}</p><span className="go"><span {...k(p, 'cards', i, 'label')}>{cd.label}</span> <Arr /></span></a>
        ))}</div></div>
      </Sec>
      <Sec id="moc-close" label={c.label} scene={4} cls="dawn final">
        <div className="sunrise"><div className="in">
          <img className="mk" src="assets/cness-mark.svg" width={64} height={64} alt="" decoding="async" />
          <span className="k2" {...k(p, 'closing', 'label')}>{c.label}</span>
          <h2 {...k(p, 'closing', 'h2')}>{c.h2}</h2>
          <p {...k(p, 'closing', 'p', 0)}>{c.p[0]}</p><p className="motto" {...k(p, 'closing', 'p', 1)}>{c.p[1]}</p>
          <div className="acts"><Cta page={p} path={['closing', 'cta']} l={c.cta} cls="btn dark" /></div>
        </div></div>
      </Sec>
    </>
  );
}
