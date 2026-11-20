// The CNESS Advantage particle field: one particle set, eleven shapes (hero nebula + ten section emblems).
// Same seeded generator, shapes, colours and placement as the approved static page (src/advantage/motion.js),
// so both draw identical fields. Pure data: no DOM access.

export const S = 11; // scenes: hero + 10 section emblems
export type RGB = [number, number, number];
export type Vec3 = [number, number, number];

export interface Formations {
  N: number;
  forms: Float32Array[];   // S arrays of N * 3 positions
  idx: Float32Array;       // N * 4: highlight group per slot (levels, plans, SuperApp ways), -1 when none
  seed: Float32Array;      // N * 4 per-particle random values
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TAU = Math.PI * 2;

export function buildFormations(N: number): Formations {
  let sd = 20261119;
  const R = () => { sd |= 0; sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const G = () => (R() + R() + R() + R() - 2) * .7;
  const F = Array.from({ length: S }, () => new Float32Array(N * 3));
  const IDX = new Float32Array(N * 4).fill(-1), SEED = new Float32Array(N * 4);
  const put = (f: number, i: number, x: number, y: number, z: number) => { const a = F[f]!; a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; };
  const onSeg = (A: number[], B: number[], t: number): Vec3 => [lerp(A[0]!, B[0]!, t), lerp(A[1]!, B[1]!, t), lerp(A[2] ?? 0, B[2] ?? 0, t)];
  // Partner network: fixed nodes, each joined to its two nearest neighbours
  const NODES: Vec3[] = Array.from({ length: 15 }, (_, k) => { const a = k * 2.399963, y = 1 - 2 * (k + .5) / 15, r = Math.sqrt(1 - y * y) * 2.3; return [Math.cos(a) * r, y * 2.1, Math.sin(a) * r * .7]; });
  const EDGES: [number, number][] = [];
  NODES.forEach((A, a) => { NODES.map((B, b): [number, number] => [b, Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2])]).filter(([b]) => b !== a).sort((p, q) => p[1] - q[1]).slice(0, 2)
    .forEach(([b]) => { if (!EDGES.some(e => e[0] === b && e[1] === a)) EDGES.push([a, b]); }); });
  // Trust Profile card geometry (portrait card with avatar and rows)
  const CW_ = 1.55, CH = 2.1, CR = .28;
  const cardEdge = (): [number, number] => { // point on a rounded rectangle outline
    const L = [2 * (CW_ - CR) * 2, 2 * (CH - CR) * 2, TAU * CR] as const, tot = L[0] + L[1] + L[2], u = R() * tot;
    if (u < L[0]) { const t = u / L[0] * 2, top = t < 1; return [lerp(-CW_ + CR, CW_ - CR, t % 1), top ? CH : -CH]; }
    if (u < L[0] + L[1]) { const t = (u - L[0]) / L[1] * 2, right = t < 1; return [right ? CW_ : -CW_, lerp(-CH + CR, CH - CR, t % 1)]; }
    const a = R() * TAU, cx = Math.cos(a) > 0 ? CW_ - CR : -CW_ + CR, cy = Math.sin(a) > 0 ? CH - CR : -CH + CR; return [cx + Math.cos(a) * CR, cy + Math.sin(a) * CR];
  };
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 4; k++) SEED[i * 4 + k] = R();
    { // 0 nebula: three spiral arms (First Light's opening field)
      const r = .5 + 5.2 * Math.pow(R(), .7), a = r * .75 + (i % 3) * TAU / 3 + G() * .5;
      put(0, i, Math.cos(a) * r, G() * Math.max(.12, 1 - r * .16), Math.sin(a) * r);
    }
    { // 1 Trust Profile: one card that brings everything together
      const u = R(); let x: number, y: number;
      if (u < .46) { [x, y] = cardEdge(); }
      else if (u < .64) { const a = R() * TAU; x = Math.cos(a) * .5; y = 1.15 + Math.sin(a) * .5; }
      else if (u < .9) { const row = Math.floor(R() * 4), w = [2.2, 1.9, 2.3, 1.4][row]!; x = -1.15 + R() * w; y = .15 - row * .42; }
      else { x = (R() - .5) * 2 * CW_; y = (R() - .5) * 2 * CH; }
      put(1, i, x + G() * .012, y + G() * .012, G() * .05);
    }
    { // 2 hexagonal lens: six facets for the six areas reviewed
      const s = i % 6, a0 = (120 - s * 60) * Math.PI / 180, a1 = a0 - Math.PI / 3, am = (a0 + a1) / 2, Rr = 2.2, gap = .09;
      const V: [number, number][] = [[0, 0], [Math.cos(a0) * Rr, Math.sin(a0) * Rr], [Math.cos(a1) * Rr, Math.sin(a1) * Rr]];
      let x: number, y: number;
      if (R() < .62) { const e = Math.floor(R() * 3), A = V[e]!, B = V[(e + 1) % 3]!, t = R(); x = lerp(A[0], B[0], t) + G() * .012; y = lerp(A[1], B[1], t) + G() * .012; }
      else { let u = R(), v = R(); if (u + v > 1) { u = 1 - u; v = 1 - v; } x = V[1]![0] * u + V[2]![0] * v; y = V[1]![1] * u + V[2]![1] * v; }
      put(2, i, x + Math.cos(am) * gap, y + Math.sin(am) * gap, G() * .07);
    }
    { // 3 three rising rings: Aspiring, Inspired, Luminary
      const u = R(), k = u < .24 ? 0 : u < .56 ? 1 : 2, Rr = 1.05 + k * .72, a = R() * TAU, g = G() * (.03 + k * .012);
      put(3, i, Math.cos(a) * (Rr + g), -1.45 + k * 1.3 + G() * (.03 + k * .012), Math.sin(a) * (Rr + g)); IDX[i * 4] = k;
    }
    { // 4 product: a box with a check on its face
      const h = 1.3, u = R(); let p: Vec3;
      if (u < .62) { const e = Math.floor(R() * 12), ax = e >> 2, s1 = (e & 1) ? h : -h, s2 = (e & 2) ? h : -h, t = (R() * 2 - 1) * h;
        p = ax === 0 ? [t, s1, s2] : ax === 1 ? [s1, t, s2] : [s1, s2, t]; }
      else if (u < .82) { const t = R(), A = [-.6, .05, h], M = [-.15, -.45, h], Z = [.7, .6, h]; p = t < .35 ? onSeg(A, M, t / .35) : onSeg(M, Z, (t - .35) / .65); p[0] += G() * .03; p[1] += G() * .03; }
      else { const f = Math.floor(R() * 6), ax = f >> 1, s = (f & 1) ? h : -h, a = (R() * 2 - 1) * h, b = (R() * 2 - 1) * h; p = ax === 0 ? [s, a, b] : ax === 1 ? [a, s, b] : [a, b, s]; }
      put(4, i, p[0] + G() * .01, p[1] + G() * .01, p[2] + G() * .01);
    }
    { // 5 globe: a place where people find organizations
      let y = 1 - 2 * (i + .5) / N; if (i % 5 < 2) y = Math.round(y * 9) / 9;
      const r = Math.sqrt(Math.max(0, 1 - y * y)), ph = i * 2.399963; put(5, i, Math.cos(ph) * r * 2.2, y * 2.2, Math.sin(ph) * r * 2.2);
    }
    { // 6 two plans, one standard: two rings that share a core
      const k = i % 2, cx = k ? .85 : -.85, a = R() * TAU, u = R(), rr = u < .7 ? 1.55 + G() * .03 : 1.55 * Math.sqrt(R());
      put(6, i, cx + Math.cos(a) * rr, Math.sin(a) * rr, G() * .06); IDX[i * 4 + 1] = k;
    }
    { // 7 partners: a network of people and organizations
      if (R() < .62) { const e = EDGES[Math.floor(R() * EDGES.length)]!, p = onSeg(NODES[e[0]]!, NODES[e[1]]!, R()); put(7, i, p[0] + G() * .015, p[1] + G() * .015, p[2] + G() * .015); }
      else { const n = NODES[Math.floor(R() * NODES.length)]!; put(7, i, n[0] + G() * .09, n[1] + G() * .09, n[2] + G() * .09); }
    }
    { // 8 shared knowledge: ripples spreading from one point
      const ring = Math.floor(Math.pow(R(), .8) * 7), r = ring === 0 ? Math.sqrt(R()) * .28 : .25 + ring * .46 + G() * .02, a = R() * TAU;
      put(8, i, Math.cos(a) * r, G() * .02, Math.sin(a) * r);
    }
    { // 9 SuperApp: a hub connected to six ways of meeting people
      const u = R(), k = i % 6, ang = (90 - k * 60) * Math.PI / 180, S9: Vec3 = [Math.cos(ang) * 2.15, Math.sin(ang) * 2.15, 0];
      if (u < .2) { const a = R() * TAU, c = R() * 2 - 1, s = Math.sqrt(1 - c * c), rr = .55 * Math.cbrt(R()); put(9, i, Math.cos(a) * s * rr, c * rr, Math.sin(a) * s * rr); }
      else if (u < .5) { const p = onSeg([0, 0, 0], S9, .25 + R() * .62); put(9, i, p[0] + G() * .02, p[1] + G() * .02, G() * .02); IDX[i * 4 + 2] = k; }
      else if (u < .82) { put(9, i, S9[0] + G() * .16, S9[1] + G() * .16, G() * .16); IDX[i * 4 + 2] = k; }
      else { const a = R() * TAU; put(9, i, Math.cos(a) * 2.15, Math.sin(a) * 2.15, G() * .03); }
    }
    { // 10 sun (the closing daylight)
      if (i % 9 === 0) { const a = R() * TAU, rr = 2.6 + R() * 1.6; put(10, i, Math.cos(a) * rr, Math.sin(a) * rr, G() * .05); }
      else { const a = R() * TAU, c = R() * 2 - 1, s = Math.sqrt(1 - c * c), rr = 1.05 * Math.pow(R(), 2.4); put(10, i, Math.cos(a) * s * rr, c * rr, Math.sin(a) * s * rr); }
    }
  }
  return { N, forms: F, idx: IDX, seed: SEED };
}

// Per-scene look: two colours, placement (wide / narrow), tilt and spin. Wide placement sits opposite the text.
const hex = (h: number): RGB => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
export const COL_A = [0x8E86FF, 0xB9A8FF, 0xFFC81A, 0xFFC81A, 0xFF9E5E, 0x5CC8FF, 0xFFC81A, 0xFF8FB1, 0x7FE0C8, 0xFFC81A, 0xFFE9A8].map(hex);
export const COL_B = [0xE3E0FF, 0xFFF1C2, 0xFFF1C2, 0xFFFFFF, 0xFFE2B8, 0xE6F7FF, 0x8E86FF, 0xFFE2B8, 0xE6FFF7, 0xE3E0FF, 0xFFFFFF].map(hex);
export const SKY = [0x060417, 0x0B0730, 0x0A0730, 0x0C0A2E, 0x1A0B22, 0x04111F, 0x0E0A30, 0x170A24, 0x041719, 0x0B0830, 0x1C1306].map(hex);
const RIG = {
  wide: [[2.5, .1, 1], [2.75, .05, .95], [-2.75, 0, 1], [2.8, -.15, 1], [-2.75, 0, .95], [2.8, 0, 1], [2.9, .1, .9], [-2.75, 0, 1], [2.7, -.2, 1.05], [2.85, 0, .92], [0, -.6, 1]] as Vec3[],
  narrow: [[0, 1.2, .62], [0, 1.45, .5], [0, 1.45, .55], [0, 1.4, .5], [0, 1.45, .52], [0, 1.45, .52], [0, 1.45, .5], [0, 1.4, .52], [0, 1.4, .55], [0, 1.45, .5], [0, -.6, .7]] as Vec3[],
  tilt: [.95, 0, 0, .42, .38, .2, 0, .15, 1.05, .2, 0],
};
const spin = (k: number, t: number) => [t * .05, Math.sin(t * .3) * .32, Math.sin(t * .22) * .28, t * .1, t * .16 + .6, t * .09, Math.sin(t * .25) * .22, t * .07, t * .035, Math.sin(t * .2) * .3, 0][k]!;
export const weights = (s: number) => { const w = new Array<number>(S); for (let k = 0; k < S; k++) w[k] = Math.max(0, 1 - Math.abs(s - k)); return w; };
export interface Pose { x: number; y: number; sc: number; tilt: number; rot: number }
export const pose = (s: number, time: number, wide: boolean): Pose => {
  const w = weights(s), rg = wide ? RIG.wide : RIG.narrow; let x = 0, y = 0, sc = 0, tilt = 0, rot = 0;
  for (let k = 0; k < S; k++) { const wk = w[k]!; if (!wk) continue; const r = rg[k]!; x += wk * r[0]; y += wk * r[1]; sc += wk * r[2]; tilt += wk * RIG.tilt[k]!; rot += wk * spin(k, time); }
  return { x, y, sc, tilt, rot };
};
export const HI_SCENE = [3, 6, 9]; // which scene each highlight slot belongs to
