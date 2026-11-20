'use client';
// The Analyze signature graphic: contour terrain, a trail with one waypoint per pillar ending at the details step,
// and a lens resting on the current step. Waypoints show only whether a pillar has been rated, never the rating.
// Geometry comes from lib/analyze/graphic.json (same generator as the static page). The lens moves with CSS
// transforms; React only sets its target when the step or the band's size changes.
import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { GRAPHIC, type Track } from '@/lib/content';

const SCALE = 1.8;
type Geo = { w: number; h: number; L: number };

export function TerrainSymbol() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <symbol id="terrain" viewBox={GRAPHIC.terrain.viewBox}>{GRAPHIC.terrain.paths.map((p, i) => <path key={i} className={p.cls} d={p.d} />)}</symbol>
    </svg>
  );
}

function Trail({ legs, lit }: { legs: string[]; lit: number }) {
  return (
    <svg className="trail" viewBox="0 0 100 100" preserveAspectRatio="none">
      {legs.map((d, i) => <path key={`b${i}`} className="leg-bg" pathLength={1} d={d} />)}
      {legs.map((d, i) => <path key={`l${i}`} className={i <= lit ? 'leg on' : 'leg'} data-leg={i} pathLength={1} d={d} />)}
    </svg>
  );
}
const Land = () => <svg className="land" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMid slice"><use href="#terrain" /></svg>;

// rated: one character per pillar, "1" once rated (a string, so the band re-renders only when completion changes)
export default memo(function RouteBand({ track, rated, at, phase, active }: {
  track: Track; rated: string; at: number; phase: 'scoring' | 'form' | 'notice'; active: boolean;
}) {
  const T = GRAPHIC.tracks[track], n = rated.length, pts = T.points as [number, number][];
  const ref = useRef<HTMLDivElement>(null), lensRef = useRef<HTMLSpanElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [snap, setSnap] = useState(true);
  const [vis, setVis] = useState(false);

  // measure the band (and the lens size set by CSS) on mount, resize and when this path becomes visible
  useLayoutEffect(() => {
    const el = ref.current; if (!el || !active) return;
    const measure = () => { if (el.offsetParent === null) return; setSnap(true); setGeo({ w: el.clientWidth, h: el.clientHeight, L: lensRef.current?.offsetWidth ?? 0 }); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [active]);
  // after a jump (resize, path switch) let the lens glide again on the next change
  useEffect(() => { if (!snap) return; let a = 0; const b = requestAnimationFrame(() => { a = requestAnimationFrame(() => setSnap(false)); }); return () => { cancelAnimationFrame(b); cancelAnimationFrame(a); }; }, [snap, geo]);
  // decorative motion plays only while the band is on screen
  useEffect(() => { const el = ref.current; if (!el) return; const io = new IntersectionObserver(es => es.forEach(e => setVis(e.isIntersecting)), { rootMargin: '60px 0px' }); io.observe(el); return () => io.disconnect(); }, []);

  const target = pts[at] ?? pts[0]!;
  let lensStyle: CSSProperties | undefined, innerStyle: CSSProperties | undefined;
  if (geo) {
    const x = target[0] / 100 * geo.w, y = target[1] / 100 * geo.h;
    lensStyle = { '--lx': `${(x - geo.L / 2).toFixed(1)}px`, '--ly': `${(y - geo.L / 2).toFixed(1)}px` } as CSSProperties;
    innerStyle = { width: `${geo.w}px`, height: `${geo.h}px`, '--ix': `${(geo.L / 2 - x * SCALE).toFixed(1)}px`, '--iy': `${(geo.L / 2 - y * SCALE).toFixed(1)}px` } as CSSProperties;
  }
  const cls = ['route', vis ? 'vis' : '', snap ? 'snap' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls} aria-hidden="true" ref={ref}>
      <div className="drift"><Land /></div>
      <Trail legs={T.legs} lit={at} />
      {pts.slice(0, n).map(([x, y], i) => (
        <i key={i} className={['wp', rated[i] === '1' ? 'rated' : '', phase === 'scoring' && i === at ? 'cur' : ''].filter(Boolean).join(' ')} data-w={i} style={{ '--x': `${x}%`, '--y': `${y}%` } as CSSProperties}>
          <b>{String(i + 1).padStart(2, '0')}</b>
        </i>
      ))}
      <i className={['wp summit', phase === 'form' ? 'cur' : '', phase === 'notice' ? 'done' : ''].filter(Boolean).join(' ')} data-w={n} style={{ '--x': `${pts[n]![0]}%`, '--y': `${pts[n]![1]}%` } as CSSProperties}>
        <svg viewBox="0 0 24 24"><path d="M4 7h16v11H4z" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
      </i>
      <span className="lens" ref={lensRef} style={lensStyle}>
        <span className="lens-in" style={innerStyle}><span className="lens-map"><Land /><Trail legs={T.legs} lit={at} /></span></span>
      </span>
      <svg className="north" viewBox="0 0 24 24"><path d="M12 3l4 10-4-2.4L8 13z" fill="currentColor" /><path d="M9.5 21v-5l5 5v-5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
    </div>
  );
});
