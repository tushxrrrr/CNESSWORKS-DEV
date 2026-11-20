import type { CSSProperties } from 'react';
// Geometry for the certification graphics, computed exactly as tools/build-certification.py does (including
// Python's number formatting), so the SVG paths and CSS positions match the approved page character for character.
import MAP from '@/tools/data/worldmap.json';

/** Python round(x, 2) */
const r2 = (x: number) => Number(x.toFixed(2));
/** Python str() of a float (as in f"{x}"): shortest repr, integers keep ".0", and -0.0 keeps its sign */
export const py = (x: number) => (Number.isInteger(x) ? (Object.is(x, -0) ? '-0.0' : x.toFixed(1)) : String(x));
/** Python f"{x:.Nf}". toFixed rounds the exact binary value correctly, except that an exact tie rounds away from
 *  zero where Python rounds to even (150.5 -> "150"). Ties are found on the exact decimal expansion (73.45 is not
 *  one: its binary value is slightly above, so both round it up). */
export const fx = (x: number, n: number) => {
  const exact = Math.abs(x).toFixed(Math.min(100, n + 60)), [int, frac = ''] = exact.split('.');
  if (!/^50*$/.test(frac.slice(n))) return x.toFixed(n);
  let digits = BigInt(int + frac.slice(0, n)); if (digits % BigInt(2) === BigInt(1)) digits += BigInt(1);
  const s = digits.toString().padStart(n + 1, '0'), body = n ? `${s.slice(0, -n)}.${s.slice(-n)}` : s;
  return (x < 0 ? '-' : '') + body;
};
/** Point at radius r and angle deg (0 = up, clockwise), rounded to 2 places as in the generator */
export const pt = (r: number, deg: number): [number, number] => { const a = deg * Math.PI / 180; return [r2(r * Math.sin(a)), r2(-r * Math.cos(a))]; };

export function canopy() {
  const ends = Array.from({ length: 9 }, (_, k) => 20 + k * 45);
  const ribs = ends.map((x, k) => ({ k, d: `M200 60Q${fx(200 + (x - 200) * .55, 0)} ${fx(64 + Math.abs(x - 200) * .05, 0)} ${x} 150` }));
  const scal = 'M20 150' + 'q22.5 17 45 0'.repeat(8);
  const shell = `M20 150Q200 -30 380 150${'q-22.5 17 -45 0'.repeat(8)}Z`;
  const seals = Array.from({ length: 7 }, (_, k) => `--x:${fx(12 + k * 12.67, 2)}%;--y:${fx(70 - Math.sin(k / 6 * Math.PI) * 9, 1)}%;--i:${k}`);
  const domeY = (x: number) => { const t = (x - 20) / 360; return (1 - t) ** 2 * 150 + 2 * (1 - t) * t * -30 + t * t * 150; };
  const motes = ([[60, 0, 3.1], [104, 1.3, 2.7], [148, .6, 3.4], [186, 2.1, 2.9], [226, .2, 3.2], [262, 1.7, 2.8], [300, .9, 3.5], [342, 2.4, 3.0], [128, 2.9, 3.3], [276, 3.4, 2.6]] as const)
    .map(([x, d, t]) => `--x:${fx(x / 4, 1)}%;--y:${fx(domeY(x) / 3.4, 1)}%;--d:${d === 0 ? '0' : py(d)}s;--t:${py(t)}s`);
  return { ribs, scal, shell, seals, motes };
}

export const MAP_ORDER = ['rest', 'India', 'Canada', 'USA', 'Europe', 'Australia', 'Japan'] as const;
type Region = typeof MAP_ORDER[number];
const M = MAP as unknown as { w: number; h: number; paths: Record<Region, string>; c: Record<Exclude<Region, 'rest'>, [number, number]> };
export function worldMap() {
  return {
    viewBox: `-1 -1 ${M.w + 1} ${M.h + 1}`,
    paths: MAP_ORDER.map(r => ({ r, d: M.paths[r] })),
    pins: MAP_ORDER.slice(1).map(r => { const c = M.c[r as Exclude<Region, 'rest'>]; return { r, style: `--x:${fx(c[0] / M.w * 100, 2)}%;--y:${fx(c[1] / (M.h - 1) * 100, 2)}%` }; }),
  };
}

export const TEMPLE_HEIGHTS = [64, 82, 96, 92, 78, 60];

export function wheel() {
  const R = 100, gap = 3.2;
  const segs = Array.from({ length: 6 }, (_, s) => {
    const a0 = s * 60, a1 = s * 60 + 60, mid = a0 + 30; const [ox, oy] = pt(gap, mid), A = pt(R, a0), Bp = pt(R, a1);
    return `M${py(ox)} ${py(oy)}L${fx(A[0] + ox, 2)} ${fx(A[1] + oy, 2)}L${fx(Bp[0] + ox, 2)} ${fx(Bp[1] + oy, 2)}Z`;
  });
  const inner = [.38, .68].map(f => { const p0 = pt(R * f, 0); return `M${py(p0[0])} ${py(p0[1])}` + [1, 2, 3, 4, 5].map(k => { const p = pt(R * f, k * 60); return `L${py(p[0])} ${py(p[1])}`; }).join('') + 'Z'; });
  return { segs, inner };
}

export const prodDots = () => Array.from({ length: 108 }, (_, k) => { const p = pt(92, k * 360 / 108); return `M${py(p[0])} ${py(p[1])}h0`; }).join('');

export function bloom() {
  const petals = Array.from({ length: 7 }, (_, k) => { const a = k * 360 / 7, L = pt(46, a - 22), Rr = pt(46, a + 22), V = pt(100, a);
    return `M0 0Q${py(L[0])} ${py(L[1])} ${py(V[0])} ${py(V[1])}Q${py(Rr[0])} ${py(Rr[1])} 0 0Z`; });
  const nums = Array.from({ length: 7 }, (_, k) => { const p = pt(30, k * 360 / 7); return `--x:${fx(50 + p[0], 1)}%;--y:${fx(50 + p[1], 1)}%`; });
  return { petals, nums };
}

/** "--a:1;--b:2" -> React style object (custom properties only) */
export const vars = (s: string) => Object.fromEntries(s.split(';').filter(Boolean).map(kv => { const i = kv.indexOf(':'); return [kv.slice(0, i), kv.slice(i + 1)]; })) as CSSProperties;
