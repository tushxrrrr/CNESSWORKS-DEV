// CNESS Advantage motion, ported from the approved static page (src/advantage/motion.js) with the same numbers.
// One fixed particle field re-forms into each offering's emblem as its section arrives; arrivals, the level rail,
// the statement words and the closing daylight follow scroll. Everything runs in one requestAnimationFrame loop
// that sleeps when nothing moves. The shared chrome (menus, mobile sheet, pause button, progress bar, back to top)
// lives in components/site/ChromeBehaviour.tsx; this engine follows its pause state (class "still" on <html>).
import { buildFormations, COL_A, COL_B, HI_SCENE, pose, S, SKY, weights, type Formations } from './formations';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Spring with Apple-style parameters: response (seconds) and damping ratio (1 = no overshoot). */
export class Spring {
  x: number; t: number; v = 0;
  constructor(x = 0, private r = .5, private d = 1) { this.x = x; this.t = x; }
  snap(x: number) { this.x = this.t = x; this.v = 0; }
  step(dt: number) {
    const w = 2 * Math.PI / this.r, k = w * w, c = 2 * this.d * w, n = Math.max(1, Math.ceil(dt / .004)), h = dt / n;
    for (let i = 0; i < n; i++) { this.v += (-k * (this.x - this.t) - c * this.v) * h; this.x += this.v * h; }
    if (Math.abs(this.x - this.t) < 1e-4 && Math.abs(this.v) < 1e-3) { this.x = this.t; this.v = 0; }
  }
  get rest() { return this.x === this.t && this.v === 0; }
}

/** State shared by the 2D fallback and the WebGL renderer (lib/advantage/field3d.ts). */
export interface FieldState extends Formations {
  still: boolean; small: boolean; time: number; covered: boolean; dirty: boolean; has3D: boolean;
  scene: Spring; intro: Spring; px: Spring; py: Spring; fade: Spring;
  hi: [number, number, number, number]; pointer: [number, number] | null;
  hooks: Set<(dt: number) => boolean>; wake: () => void;
}

interface Anchor { el: HTMLElement; scene: number; hi: number }
type WithIn = HTMLElement & { _in?: number };

export function startAdvantage(): () => void {
  const root = document.documentElement;
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
  const off: Array<() => void> = [];
  const on = (el: EventTarget | null, ev: string, fn: EventListener, opt?: AddEventListenerOptions) => { if (!el) return; el.addEventListener(ev, fn, opt); off.push(() => el.removeEventListener(ev, fn, opt)); };

  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = innerWidth < 760 || (!!nav.deviceMemory && nav.deviceMemory < 4) || (!!nav.hardwareConcurrency && nav.hardwareConcurrency < 4);
  const N = innerWidth < 760 ? 9000 : small ? 16000 : 28000;
  const still0 = mq.matches || root.classList.contains('still');
  const CW: FieldState = {
    ...buildFormations(N), still: still0, small, time: 3, covered: false, dirty: true, has3D: false,
    scene: new Spring(0, .8), intro: new Spring(still0 ? 1 : 0, 1.6), px: new Spring(0, .9), py: new Spring(0, .9), fade: new Spring(1, .25),
    hi: [-1, -1, -1, -1], pointer: null, hooks: new Set(), wake: () => wake(),
  };
  let sceneT = 0, jump: number | null = null, scrollDirty = true, alive = true;

  // Pause state comes from the shared chrome: follow the class on <html>
  const syncStill = () => { const s = root.classList.contains('still'); if (s === CW.still) return; CW.still = s; scrollDirty = true; CW.dirty = true; wake(); };
  const mo = new MutationObserver(syncStill); mo.observe(root, { attributes: true, attributeFilter: ['class'] }); off.push(() => mo.disconnect());

  /* ---------- Scroll-driven layout ---------- */
  const anchors: Anchor[] = $$('[data-scene]').map(el => ({ el, scene: +(el.dataset.scene ?? 0), hi: el.dataset.hi === undefined ? -1 : +el.dataset.hi }));
  const ins = $$<WithIn>('[data-in]'), dots = $$<HTMLAnchorElement>('#dots a'), sky = $('.sky')!, field = $('#field')!;
  const levels = $('#levels'), rail = levels && $('.rail i', levels), final = $('#start')!, foot = $('footer')!;
  const says = $$('[data-say]').map(el => ({ el, words: $$('.wd', el) }));
  const dotFor = (id: string) => dots.findIndex(d => d.getAttribute('href') === '#' + id);
  let vh = innerHeight, curDot = -2;
  function layout() {
    vh = innerHeight;
    // arrivals: settle in from a visible state as each block crosses the lower part of the screen
    for (const el of ins) { const r = el.getBoundingClientRect(); const v = CW.still ? 1 : smooth(clamp((vh * 1.02 - r.top) / (vh * .38))); if (el._in !== v) { el._in = v; el.style.setProperty('--in', v.toFixed(3)); } }
    // scene: the last anchor whose top has passed the middle; blend toward the next as it rises
    let i = 0; const tops = anchors.map(a => a.el.getBoundingClientRect().top);
    for (let k = 0; k < anchors.length; k++) if (tops[k]! <= vh * .5) i = k;
    const cur0 = anchors[i]!, nx = anchors[i + 1], tt = nx ? smooth(clamp((vh * .95 - tops[i + 1]!) / (vh * .45))) : 0;
    const target = nx ? lerp(cur0.scene, nx.scene, tt) : cur0.scene;
    jump = Math.abs(target - CW.scene.x) > 1.6 && !CW.still ? target : null;   // long jumps re-form behind a fade
    sceneT = target;
    CW.hi[0] = cur0.scene === 3 ? (tt > .5 && nx && nx.hi >= 0 ? nx.hi : cur0.hi) : -1;
    const cur = tt > .5 ? i + 1 : i, dk = dotFor(anchors[cur]!.el.id);
    if (dk !== curDot) { curDot = dk; dots.forEach((d, j) => j === dk ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')); }
    // the level rail fills through the three levels
    if (levels && rail) { const r = levels.getBoundingClientRect(); rail.parentElement!.style.setProperty('--fill', (CW.still ? 1 : clamp((vh * .55 - r.top) / r.height)).toFixed(4)); }
    // statement lines: words light up as they rise (floor keeps them above 3:1)
    for (const s of says) { const r = s.el.getBoundingClientRect(), sp = CW.still ? 1 : clamp((vh * .85 - r.top) / (r.height + vh * .3)), lit = sp * s.words.length * 1.2;
      s.words.forEach((w, k) => w.style.setProperty('--o', (.45 + .55 * clamp(lit - k)).toFixed(3))); }
    // closing daylight: the circle opens as the section arrives; the text is always inside it
    const fr = final.getBoundingClientRect(), rv = CW.still ? 1 : smooth(clamp((vh - fr.top) / (vh * .75)));
    final.style.setProperty('--r', rv.toFixed(4));
    root.classList.toggle('day', fr.top < 40 && fr.bottom > 80);
    const fo = foot.getBoundingClientRect();
    CW.covered = (fr.top < 0 && fr.bottom > vh) || fo.top < vh * .1;
    root.classList.toggle('hide-quick', fr.top < vh * .7 && fo.top > -1e4);
    CW.dirty = true;
  }

  /* ---------- Canvas 2D fallback (same formations, fewer particles) ---------- */
  const c2 = $<HTMLCanvasElement>('#f2d')!, ctx = c2.getContext('2d')!;
  let W = 0, Hh = 0, dpr = 1; const STR = Math.max(1, Math.floor(N / 5200));
  const size2d = () => { dpr = Math.min(1.5, devicePixelRatio || 1); W = field.clientWidth; Hh = field.clientHeight; c2.width = W * dpr; c2.height = Hh * dpr; CW.dirty = true; };
  const { forms: F, seed: SEED, idx: IDX } = CW;
  function draw2d() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh); ctx.globalCompositeOperation = 'lighter';
    const s0 = CW.scene.x, time = CW.time, wide = W / Hh > 1.05, ps = pose(s0, time, wide), f = (Hh / 2) / Math.tan(20 * Math.PI / 180);
    const cy = Math.cos(ps.rot + CW.px.x * .25), sy = Math.sin(ps.rot + CW.px.x * .25), cx_ = Math.cos(ps.tilt + CW.py.x * .15), sx_ = Math.sin(ps.tilt + CW.py.x * .15), intro = CW.intro.x * CW.fade.x;
    for (let i = 0; i < N; i += STR) {
      const sc = clamp(s0 + (SEED[i * 4]! - .5) * (CW.still ? 0 : .5), 0, S - 1), k = Math.floor(sc), fr = smooth(sc - k), k2 = Math.min(S - 1, k + 1), A = F[k]!, B = F[k2]!, j = i * 3;
      const m = Math.sin(fr * Math.PI) * 1.4;
      let x = lerp(A[j]!, B[j]!, fr) + Math.sin(SEED[i * 4 + 1]! * 50 + time * .4) * m, y = lerp(A[j + 1]!, B[j + 1]!, fr) + Math.cos(SEED[i * 4 + 2]! * 50 + time * .3) * m, z = lerp(A[j + 2]!, B[j + 2]!, fr);
      const sp = 1 + (1 - CW.intro.x) * 1.8; x *= sp; y *= sp; z *= sp;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cx_ - z1 * sx_, z2 = y * sx_ + z1 * cx_;
      const X = x1 * ps.sc + ps.x, Y = y1 * ps.sc + ps.y, Z = z2 * ps.sc, d = 10 - Z; if (d < .5) continue;
      const px = W / 2 + X * f / d, py = Hh / 2 - Y * f / d;
      let hi = 1; const sceneN = Math.round(sc), slot = HI_SCENE.indexOf(sceneN);
      if (slot >= 0 && CW.hi[slot]! >= 0) hi = IDX[i * 4 + slot] === CW.hi[slot] ? 1.7 : .5;
      const cA = COL_A[sceneN]!, cB = COL_B[sceneN]!, t = SEED[i * 4 + 3]!;
      ctx.fillStyle = `rgba(${lerp(cA[0], cB[0], t) * 255 | 0},${lerp(cA[1], cB[1], t) * 255 | 0},${lerp(cA[2], cB[2], t) * 255 | 0},${clamp((.35 + .5 * SEED[i * 4 + 2]!) * hi * intro)})`;
      const szz = (1.5 + SEED[i * 4 + 1]! * 1.8) * 10 / d * (hi > 1 ? 1.4 : 1); ctx.fillRect(px, py, szz, szz);
    }
  }
  const ro = new ResizeObserver(() => { size2d(); scrollDirty = true; wake(); }); ro.observe(field); off.push(() => ro.disconnect()); size2d();

  /* ---------- One loop for the whole page ---------- */
  let raf = 0, last = 0;
  const springs = [CW.scene, CW.intro, CW.px, CW.py, CW.fade];
  function tick(now: number) {
    raf = 0; if (!alive) return;
    const dt = Math.min(1 / 30, (now - (last || now)) / 1000 || 1 / 60); last = now;
    if (scrollDirty) { scrollDirty = false; layout(); }
    const moving = !CW.still && !document.hidden && !CW.covered;
    if (moving) CW.time += dt;
    // long jumps (from the index or the dots): fade out, re-form, fade back in
    if (jump != null) { CW.fade.t = 0; if (CW.fade.x < .05) { CW.scene.snap(jump); jump = null; } } else CW.fade.t = 1;
    if (jump == null) CW.scene.t = sceneT;
    if (CW.still) { CW.scene.snap(sceneT); jump = null; CW.intro.snap(1); CW.px.snap(0); CW.py.snap(0); CW.fade.snap(1); } else springs.forEach(s => s.step(dt));
    const w = weights(CW.scene.x); let r = 0, g = 0, b = 0;
    for (let k = 0; k < S; k++) { const c = SKY[k]!, wk = w[k]!; r += wk * c[0]; g += wk * c[1]; b += wk * c[2]; }
    sky.style.background = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`;
    let more = false; CW.hooks.forEach(h => { if (h(dt)) more = true; });
    if (!CW.has3D && (moving || CW.dirty) && !CW.covered) draw2d();
    CW.dirty = false;
    if (moving || more || springs.some(s => !s.rest) || scrollDirty || jump != null) raf = requestAnimationFrame(tick); else last = 0;
  }
  const wake = () => { if (!raf && alive) raf = requestAnimationFrame(tick); };
  on(window, 'scroll', () => { scrollDirty = true; wake(); }, { passive: true });
  on(window, 'resize', () => { scrollDirty = true; wake(); });
  on(document, 'visibilitychange', wake);
  on(window, 'pointermove', (e: Event) => { const p = e as PointerEvent; if (p.pointerType !== 'mouse' || CW.still) return; CW.px.t = p.clientX / innerWidth - .5; CW.py.t = p.clientY / innerHeight - .5; CW.pointer = [p.clientX, p.clientY]; wake(); }, { passive: true });
  CW.intro.t = 1;

  /* ---------- Pointer glow and field highlights ---------- */
  $$('.plan, .way').forEach(p => on(p, 'pointermove', (e: Event) => { const m = e as PointerEvent, r = p.getBoundingClientRect(); p.style.setProperty('--mx', (m.clientX - r.left) + 'px'); p.style.setProperty('--my', (m.clientY - r.top) + 'px'); }));
  const lite = (slot: number, k: number) => { CW.hi[slot] = k; CW.dirty = true; wake(); };
  $$('.plan').forEach(p => { const k = +(p.dataset.plan ?? -1); ['pointerenter', 'focusin'].forEach(ev => on(p, ev, () => lite(1, k))); ['pointerleave', 'focusout'].forEach(ev => on(p, ev, () => lite(1, -1))); });
  const ways = $$('.way');
  ways.forEach(w => { const k = +(w.dataset.way ?? -1);
    on(w, 'pointerenter', (e: Event) => { if ((e as PointerEvent).pointerType === 'mouse') lite(2, k); });
    on(w, 'pointerleave', (e: Event) => { if ((e as PointerEvent).pointerType === 'mouse') lite(2, -1); });
    on(w, 'pointerdown', (e: Event) => { if ((e as PointerEvent).pointerType === 'mouse') return; const was = w.classList.contains('on'); ways.forEach(x => x.classList.remove('on')); w.classList.toggle('on', !was); lite(2, was ? -1 : k); }); });

  /* ---------- WebGL field: loaded after the page is interactive; the 2D drawing stands in until then ---------- */
  import('./field3d').then(m => { if (alive) off.push(m.startField3D(CW, field, c2)); }).catch(() => { CW.has3D = false; });

  wake();
  return () => {
    alive = false; cancelAnimationFrame(raf); off.forEach(f => f());
    root.classList.remove('day', 'hide-quick');
  };
}
