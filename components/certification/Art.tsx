// Decorative graphics of the three certification pages (aria-hidden; inline SVG and CSS, no WebGL).
// Geometry comes from lib/certification/geometry.ts, which reproduces tools/build-certification.py exactly.
import { bloom, canopy, prodDots, TEMPLE_HEIGHTS, vars, wheel, worldMap } from '@/lib/certification/geometry';
import { v } from './parts';

/** Mother of Certification hero: one canopy over seven seals; light falls onto it and stops there. */
export function Canopy() {
  const g = canopy();
  return (
    <div className="art canopy" data-par="" aria-hidden="true">
      <div className="motes">{g.motes.map((s, i) => <b key={i} style={vars(s)} />)}</div>
      <div className="beam" />
      <svg className="dome" viewBox="0 0 400 340"><defs><linearGradient id="cg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="220"><stop offset="0" stopColor="#FFE8A3" /><stop offset="1" stopColor="#FFC81A" /></linearGradient></defs>
        <path className="shell" d={g.shell} />
        <g className="ribs">{g.ribs.map(r => <path key={r.k} pathLength={1} style={v({ '--i': r.k })} d={r.d} />)}</g><path className="edge" pathLength={1} d={g.scal} /><path className="stem" pathLength={1} d="M200 60V292q0 22-20 22q-15 0-17-15" /></svg>
      <div className="seals">{g.seals.map((s, i) => <i key={i} style={vars(s)} />)}</div>
    </div>
  );
}

/** Mother of Certification industry table: dotted world map; the region chosen in the filter lights up. */
export function WorldMap() {
  const m = worldMap();
  return (
    <div className="art wmap" data-region="All" aria-hidden="true">
      <svg viewBox={m.viewBox} preserveAspectRatio="xMidYMid meet">{m.paths.map(p => <path key={p.r} className="r" data-r={p.r} d={p.d} />)}</svg>
      {m.pins.map(p => <i key={p.r} data-r={p.r} style={vars(p.style)} />)}
    </div>
  );
}

/** Mother of Certification compare: two frameworks move inside one larger ring. */
export const Join = ({ labels }: { labels: [string, string] }) => (
  <div className="art join" aria-hidden="true"><span className="big" /><span className="a">{labels[0]}</span><span className="b">{labels[1]}</span></div>
);

/** Organization hero: six columns of light, one per pillar. */
export const Temple = () => (
  <div className="art temple" data-par="" aria-hidden="true"><span className="arc" /><ul>{TEMPLE_HEIGHTS.map((h, i) => <li key={i} style={v({ '--h': `${h}%`, '--i': i })}><i /></li>)}</ul><span className="base" /></div>
);

/** Organization evaluate: six segments of one hexagon; the pillar in focus turns to the top. */
export function Wheel({ ns }: { ns: string[] }) {
  const g = wheel();
  return (
    <div className="art wheel" aria-hidden="true"><span className="sweep" />
      <div className="rot"><svg viewBox="-112 -112 224 224">{g.segs.map((d, s) => <path key={s} className="seg" data-i={s} d={d} />)}<g className="lat">{g.inner.map((d, i) => <path key={i} d={d} />)}</g></svg></div>
      <span className="ctr">{ns.map((n, s) => <b key={s} data-i={s}>{n}</b>)}</span>
    </div>
  );
}

const Check = () => <svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
/** Product hero: a product in a slow turn, inside one ring of 108 places. */
export const Prod = () => (
  <div className="art prod" data-par="" aria-hidden="true">
    <div className="orb"><svg viewBox="-100 -100 200 200"><path d={prodDots()} /></svg></div>
    <div className="orb comet"><i /></div>
    <div className="scene"><div className="cube">
      <i className="fc f1"><Check /></i><i className="fc f2"><img src="assets/cness-mark.svg" alt="" /></i><i className="fc f3" /><i className="fc f4" /><i className="fc f5"><Check /></i><i className="fc f6" />
    </div></div>
    <span className="pool" />
  </div>
);

/** Product 108: an invitation that opens as it arrives. */
export const Invite = ({ mark }: { mark: string }) => (
  <div className="art invite" aria-hidden="true"><div className="env"><span className="back" /><span className="card"><b>{mark}</b><i /><i /><i /></span>
    <svg className="front" viewBox="0 0 100 60" preserveAspectRatio="none"><defs><linearGradient id="ivg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E2488" /><stop offset="1" stopColor="#19125A" /></linearGradient></defs><path d="M0 4Q0 0 3 1.5L50 34L97 1.5Q100 0 100 4V56Q100 60 96 60H4Q0 60 0 56Z" fill="url(#ivg)" stroke="rgba(255,200,26,.45)" strokeWidth=".4" vectorEffect="non-scaling-stroke" /></svg>
    <span className="flap" /><span className="seal">✦</span></div></div>
);

/** Product evaluate: seven petals, one per pillar. */
export function Bloom({ ns }: { ns: string[] }) {
  const g = bloom();
  return (
    <div className="art bloom" aria-hidden="true">
      <svg viewBox="-104 -104 208 208"><circle className="halo" r="100" />{g.petals.map((d, i) => <path key={i} className="pet" data-i={i} style={v({ '--i': i })} d={d} />)}<circle className="core" r="9" /></svg>
      {ns.map((n, i) => <b key={i} data-i={i} style={vars(g.nums[i]!)}>{n}</b>)}
    </div>
  );
}
