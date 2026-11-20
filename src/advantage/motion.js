(() => {
  'use strict';
  const root = document.documentElement; root.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Spring (response + damping ratio; critically damped by default) ---------- */
  class Spring {
    constructor(x = 0, response = .5, damping = 1) { this.x = x; this.t = x; this.v = 0; this.r = response; this.d = damping; }
    snap(x) { this.x = this.t = x; this.v = 0; }
    step(dt) { const w = 2 * Math.PI / this.r, k = w * w, c = 2 * this.d * w, n = Math.max(1, Math.ceil(dt / .004)), h = dt / n;
      for (let i = 0; i < n; i++) { this.v += (-k * (this.x - this.t) - c * this.v) * h; this.x += this.v * h; }
      if (Math.abs(this.x - this.t) < 1e-4 && Math.abs(this.v) < 1e-3) { this.x = this.t; this.v = 0; } }
    get rest() { return this.x === this.t && this.v === 0; }
  }

  /* ---------- Shared state ---------- */
  const S = 11;                                     // scenes: hero + 10 section emblems
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const small = innerWidth < 760 || (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  const CW = window.CW = { S, still: mq.matches, scene: new Spring(0, .8), sceneT: 0, hi: [-1, -1, -1, -1], time: 3, intro: new Spring(mq.matches ? 1 : 0, 1.6),
    px: new Spring(0, .9), py: new Spring(0, .9), fade: new Spring(1, .25), mouse: [0, 0, 0], has3D: false, dirty: true, covered: false, small, Spring };

  /* ---------- Formations: one particle set, eleven shapes ---------- */
  const N = CW.N = innerWidth < 760 ? 9000 : small ? 16000 : 28000;
  let sd = 20261119; const R = () => { sd |= 0; sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const G = () => (R() + R() + R() + R() - 2) * .7;
  const TAU = Math.PI * 2;
  const F = CW.forms = Array.from({ length: S }, () => new Float32Array(N * 3));
  const IDX = CW.idx = new Float32Array(N * 4).fill(-1), SEED = CW.seed = new Float32Array(N * 4);
  const put = (f, i, x, y, z) => { F[f][i * 3] = x; F[f][i * 3 + 1] = y; F[f][i * 3 + 2] = z; };
  const onSeg = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2] || 0, B[2] || 0, t)];
  // Partner network: fixed nodes, each joined to its two nearest neighbours
  const NODES = Array.from({ length: 15 }, (_, k) => { const a = k * 2.399963, y = 1 - 2 * (k + .5) / 15, r = Math.sqrt(1 - y * y) * 2.3; return [Math.cos(a) * r, y * 2.1, Math.sin(a) * r * .7]; });
  const EDGES = []; NODES.forEach((A, a) => { NODES.map((B, b) => [b, Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2])]).filter(([b]) => b !== a).sort((p, q) => p[1] - q[1]).slice(0, 2).forEach(([b]) => { if (!EDGES.some(e => e[0] === b && e[1] === a)) EDGES.push([a, b]); }); });
  // Trust Profile card geometry (portrait card with avatar and rows)
  const CW_ = 1.55, CH = 2.1, CR = .28;
  const cardEdge = () => { // point on a rounded rectangle outline
    const L = [2 * (CW_ - CR) * 2, 2 * (CH - CR) * 2, TAU * CR], tot = L[0] + L[1] + L[2], u = R() * tot;
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
      const u = R(); let x, y;
      if (u < .46) { [x, y] = cardEdge(); }
      else if (u < .64) { const a = R() * TAU; x = Math.cos(a) * .5; y = 1.15 + Math.sin(a) * .5; }
      else if (u < .9) { const row = Math.floor(R() * 4), w = [2.2, 1.9, 2.3, 1.4][row]; x = -1.15 + R() * w; y = .15 - row * .42; }
      else { x = (R() - .5) * 2 * CW_; y = (R() - .5) * 2 * CH; }
      put(1, i, x + G() * .012, y + G() * .012, G() * .05);
    }
    { // 2 hexagonal lens: six facets for the six areas reviewed
      const s = i % 6, a0 = (120 - s * 60) * Math.PI / 180, a1 = a0 - Math.PI / 3, am = (a0 + a1) / 2, Rr = 2.2, gap = .09;
      const V = [[0, 0], [Math.cos(a0) * Rr, Math.sin(a0) * Rr], [Math.cos(a1) * Rr, Math.sin(a1) * Rr]];
      let x, y;
      if (R() < .62) { const e = Math.floor(R() * 3), A = V[e], B = V[(e + 1) % 3], t = R(); x = lerp(A[0], B[0], t) + G() * .012; y = lerp(A[1], B[1], t) + G() * .012; }
      else { let u = R(), v = R(); if (u + v > 1) { u = 1 - u; v = 1 - v; } x = V[1][0] * u + V[2][0] * v; y = V[1][1] * u + V[2][1] * v; }
      put(2, i, x + Math.cos(am) * gap, y + Math.sin(am) * gap, G() * .07);
    }
    { // 3 three rising rings: Aspiring, Inspired, Luminary
      const u = R(), k = u < .24 ? 0 : u < .56 ? 1 : 2, Rr = 1.05 + k * .72, a = R() * TAU, g = G() * (.03 + k * .012);
      put(3, i, Math.cos(a) * (Rr + g), -1.45 + k * 1.3 + G() * (.03 + k * .012), Math.sin(a) * (Rr + g)); IDX[i * 4] = k;
    }
    { // 4 product: a box with a check on its face
      const h = 1.3, u = R(); let p;
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
      if (R() < .62) { const e = EDGES[Math.floor(R() * EDGES.length)], p = onSeg(NODES[e[0]], NODES[e[1]], R()); put(7, i, p[0] + G() * .015, p[1] + G() * .015, p[2] + G() * .015); }
      else { const n = NODES[Math.floor(R() * NODES.length)]; put(7, i, n[0] + G() * .09, n[1] + G() * .09, n[2] + G() * .09); }
    }
    { // 8 shared knowledge: ripples spreading from one point
      const ring = Math.floor(Math.pow(R(), .8) * 7), r = ring === 0 ? Math.sqrt(R()) * .28 : .25 + ring * .46 + G() * .02, a = R() * TAU;
      put(8, i, Math.cos(a) * r, G() * .02, Math.sin(a) * r);
    }
    { // 9 SuperApp: a hub connected to six ways of meeting people
      const u = R(), k = i % 6, ang = (90 - k * 60) * Math.PI / 180, S9 = [Math.cos(ang) * 2.15, Math.sin(ang) * 2.15, 0];
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
  // Per-scene look: two colours, placement (wide / narrow), tilt and spin. Wide placement sits opposite the text.
  const hex = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
  CW.colA = [0x8E86FF, 0xB9A8FF, 0xFFC81A, 0xFFC81A, 0xFF9E5E, 0x5CC8FF, 0xFFC81A, 0xFF8FB1, 0x7FE0C8, 0xFFC81A, 0xFFE9A8].map(hex);
  CW.colB = [0xE3E0FF, 0xFFF1C2, 0xFFF1C2, 0xFFFFFF, 0xFFE2B8, 0xE6F7FF, 0x8E86FF, 0xFFE2B8, 0xE6FFF7, 0xE3E0FF, 0xFFFFFF].map(hex);
  const SKY = [0x060417, 0x0B0730, 0x0A0730, 0x0C0A2E, 0x1A0B22, 0x04111F, 0x0E0A30, 0x170A24, 0x041719, 0x0B0830, 0x1C1306].map(hex);
  CW.rig = { wide: [[2.5, .1, 1], [2.75, .05, .95], [-2.75, 0, 1], [2.8, -.15, 1], [-2.75, 0, .95], [2.8, 0, 1], [2.9, .1, .9], [-2.75, 0, 1], [2.7, -.2, 1.05], [2.85, 0, .92], [0, -.6, 1]],
    narrow: [[0, 1.2, .62], [0, 1.45, .5], [0, 1.45, .55], [0, 1.4, .5], [0, 1.45, .52], [0, 1.45, .52], [0, 1.45, .5], [0, 1.4, .52], [0, 1.4, .55], [0, 1.45, .5], [0, -.6, .7]],
    tilt: [.95, 0, 0, .42, .38, .2, 0, .15, 1.05, .2, 0] };
  CW.spin = (k, t) => [t * .05, Math.sin(t * .3) * .32, Math.sin(t * .22) * .28, t * .1, t * .16 + .6, t * .09, Math.sin(t * .25) * .22, t * .07, t * .035, Math.sin(t * .2) * .3, 0][k];
  const wts = CW.wts = (s) => { const w = new Array(S); for (let k = 0; k < S; k++) w[k] = Math.max(0, 1 - Math.abs(s - k)); return w; };
  CW.pose = (s, time, wide) => { const w = wts(s), rg = wide ? CW.rig.wide : CW.rig.narrow; let x = 0, y = 0, sc = 0, tilt = 0, rot = 0;
    for (let k = 0; k < S; k++) if (w[k]) { x += w[k] * rg[k][0]; y += w[k] * rg[k][1]; sc += w[k] * rg[k][2]; tilt += w[k] * CW.rig.tilt[k]; rot += w[k] * CW.spin(k, time); }
    return { x, y, sc, tilt, rot }; };
  CW.HI_SCENE = [3, 6, 9];                           // which scene each highlight slot belongs to

  /* ---------- Motion control ---------- */
  const motionBtn = $('#motionBtn');
  const applyStill = () => { root.classList.toggle('still', CW.still); motionBtn.setAttribute('aria-pressed', String(CW.still)); const l = CW.still ? 'Play motion' : 'Pause motion'; motionBtn.setAttribute('aria-label', l); motionBtn.title = l; scrollDirty = true; CW.dirty = true; wake(); };
  motionBtn.addEventListener('click', () => { CW.still = !CW.still; applyStill(); });
  mq.addEventListener?.('change', e => { CW.still = e.matches; applyStill(); });

  /* ---------- Words: hero headline and the two statement lines (spaces kept as text nodes) ---------- */
  const splitWords = (el, cls, list) => (function wrap(node) { [...node.childNodes].forEach(n => { if (n.nodeType !== 3) return wrap(n); const fr = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach(p => { if (!p) return; if (/^\s+$/.test(p)) return fr.appendChild(document.createTextNode(p)); const s = document.createElement('span'); s.className = cls; s.textContent = p; fr.appendChild(s); list && list.push(s); }); n.replaceWith(fr); }); })(el);
  const hw = []; splitWords($('#h-hero'), 'w', hw); hw.forEach((s, i) => s.style.setProperty('--i', i));
  const says = $$('[data-say]').map(el => { const words = []; splitWords(el, 'wd', words); return { el, words }; });

  /* ---------- Scroll-driven layout ---------- */
  const anchors = $$('[data-scene]').map(el => ({ el, scene: +el.dataset.scene, hi: el.dataset.hi === undefined ? -1 : +el.dataset.hi, name: el.dataset.name }));
  const ins = $$('[data-in]'), bar = $('#bar'), dots = $$('#dots a'), sky = $('.sky'), field = $('#field');
  const levels = $('#levels'), rail = levels && $('.rail i', levels), final = $('#start'), foot = $('footer'), totop = $('#totop');
  const dotFor = id => dots.findIndex(d => d.getAttribute('href') === '#' + id);
  let vh = innerHeight, curDot = -2, scrollDirty = true;
  function layout() {
    vh = innerHeight;
    const y = scrollY, H = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${H > 0 ? clamp(y / H) : 0})`;
    root.classList.toggle('scrolled', y > 8);
    // arrivals: settle in from a visible state as each block crosses the lower part of the screen
    for (const el of ins) { const r = el.getBoundingClientRect(); const v = CW.still ? 1 : smooth(clamp((vh * 1.02 - r.top) / (vh * .38))); if (el._in !== v) { el._in = v; el.style.setProperty('--in', v.toFixed(3)); } }
    // scene: the last anchor whose top has passed the middle; blend toward the next as it rises
    let i = 0; const tops = anchors.map(a => a.el.getBoundingClientRect().top);
    for (let k = 0; k < anchors.length; k++) if (tops[k] <= vh * .5) i = k;
    const nx = anchors[i + 1], tt = nx ? smooth(clamp((vh * .95 - tops[i + 1]) / (vh * .45))) : 0;
    const target = nx ? lerp(anchors[i].scene, nx.scene, tt) : anchors[i].scene;
    if (Math.abs(target - CW.scene.x) > 1.6 && !CW.still) CW.jump = target; else CW.jump = null;   // long jumps re-form behind a fade
    CW.sceneT = target;
    CW.hi[0] = anchors[i].scene === 3 ? (tt > .5 && nx && nx.hi >= 0 ? nx.hi : anchors[i].hi) : -1;
    const cur = tt > .5 ? i + 1 : i, dk = dotFor(anchors[cur].el.id);
    if (dk !== curDot) { curDot = dk; dots.forEach((d, j) => j === dk ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')); }
    // the level rail fills through the three levels
    if (levels) { const r = levels.getBoundingClientRect(); rail.parentElement.style.setProperty('--fill', (CW.still ? 1 : clamp((vh * .55 - r.top) / r.height)).toFixed(4)); }
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
    totop.hidden = y < vh;
    CW.dirty = true;
  }

  /* ---------- Canvas 2D fallback (same formations, fewer particles) ---------- */
  const c2 = $('#f2d'), ctx = c2.getContext('2d');
  let W = 0, Hh = 0, dpr = 1; const STR = Math.max(1, Math.floor(N / 5200));
  const size2d = () => { dpr = Math.min(1.5, devicePixelRatio || 1); W = field.clientWidth; Hh = field.clientHeight; c2.width = W * dpr; c2.height = Hh * dpr; CW.dirty = true; };
  function draw2d() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh); ctx.globalCompositeOperation = 'lighter';
    const s0 = CW.scene.x, time = CW.time, wide = W / Hh > 1.05, pose = CW.pose(s0, time, wide), f = (Hh / 2) / Math.tan(20 * Math.PI / 180);
    const cy = Math.cos(pose.rot + CW.px.x * .25), sy = Math.sin(pose.rot + CW.px.x * .25), cx_ = Math.cos(pose.tilt + CW.py.x * .15), sx_ = Math.sin(pose.tilt + CW.py.x * .15), intro = CW.intro.x * CW.fade.x;
    for (let i = 0; i < N; i += STR) {
      const sc = clamp(s0 + (SEED[i * 4] - .5) * (CW.still ? 0 : .5), 0, S - 1), k = Math.floor(sc), fr = smooth(sc - k), k2 = Math.min(S - 1, k + 1), A = F[k], B = F[k2], j = i * 3;
      const m = Math.sin(fr * Math.PI) * 1.4;
      let x = lerp(A[j], B[j], fr) + Math.sin(SEED[i * 4 + 1] * 50 + time * .4) * m, y = lerp(A[j + 1], B[j + 1], fr) + Math.cos(SEED[i * 4 + 2] * 50 + time * .3) * m, z = lerp(A[j + 2], B[j + 2], fr);
      const sp = 1 + (1 - CW.intro.x) * 1.8; x *= sp; y *= sp; z *= sp;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cx_ - z1 * sx_, z2 = y * sx_ + z1 * cx_;
      const X = x1 * pose.sc + pose.x, Y = y1 * pose.sc + pose.y, Z = z2 * pose.sc, d = 10 - Z; if (d < .5) continue;
      const px = W / 2 + X * f / d, py = Hh / 2 - Y * f / d;
      let hi = 1; const sceneN = Math.round(sc), slot = CW.HI_SCENE.indexOf(sceneN);
      if (slot >= 0 && CW.hi[slot] >= 0) hi = IDX[i * 4 + slot] === CW.hi[slot] ? 1.7 : .5;
      const cA = CW.colA[sceneN], cB = CW.colB[sceneN], t = SEED[i * 4 + 3];
      ctx.fillStyle = `rgba(${lerp(cA[0], cB[0], t) * 255 | 0},${lerp(cA[1], cB[1], t) * 255 | 0},${lerp(cA[2], cB[2], t) * 255 | 0},${clamp((.35 + .5 * SEED[i * 4 + 2]) * hi * intro)})`;
      const szz = (1.5 + SEED[i * 4 + 1] * 1.8) * 10 / d * (hi > 1 ? 1.4 : 1); ctx.fillRect(px, py, szz, szz);
    }
  }
  new ResizeObserver(() => { size2d(); scrollDirty = true; wake(); }).observe(field); size2d();

  /* ---------- One loop for the whole page ---------- */
  let raf = 0, last = 0; const hooks = CW.hooks = new Set();
  function tick(now) {
    const dt = Math.min(1 / 30, (now - (last || now)) / 1000 || 1 / 60); last = now;
    if (scrollDirty) { scrollDirty = false; layout(); }
    const moving = !CW.still && !document.hidden && !CW.covered;
    if (moving) CW.time += dt;
    // long jumps (from the index or the dots): fade out, re-form, fade back in
    if (CW.jump != null) { CW.fade.t = 0; if (CW.fade.x < .05) { CW.scene.snap(CW.jump); CW.jump = null; } } else CW.fade.t = 1;
    if (CW.jump == null) CW.scene.t = CW.sceneT;
    const springs = [CW.scene, CW.intro, CW.px, CW.py, CW.fade];
    if (CW.still) { CW.scene.snap(CW.sceneT); CW.jump = null; CW.intro.snap(1); CW.px.snap(0); CW.py.snap(0); CW.fade.snap(1); } else springs.forEach(s => s.step(dt));
    const w = wts(CW.scene.x); let r = 0, g = 0, b = 0; for (let k = 0; k < S; k++) { r += w[k] * SKY[k][0]; g += w[k] * SKY[k][1]; b += w[k] * SKY[k][2]; }
    sky.style.background = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`;
    let more = false; hooks.forEach(h => { if (h(dt)) more = true; });
    if (!CW.has3D && (moving || CW.dirty) && !CW.covered) draw2d();
    CW.dirty = false;
    raf = (moving || more || springs.some(s => !s.rest) || scrollDirty || CW.jump != null) ? requestAnimationFrame(tick) : (last = 0, 0);
  }
  const wake = CW.wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
  // Below 1200px the quick actions step aside while the reader scrolls down, and return on any scroll up
  const quickEl = $('.quick'); let lastY = scrollY;
  addEventListener('scroll', () => { scrollDirty = true; wake();
    const y = scrollY, dy = y - lastY; lastY = y;
    if (innerWidth >= 1200 || quickEl.contains(document.activeElement)) root.classList.remove('dock-away');
    else if (dy > 6 && y > 240) root.classList.add('dock-away'); else if (dy < -6 || y < 240) root.classList.remove('dock-away');
  }, { passive: true });
  quickEl.addEventListener('focusin', () => root.classList.remove('dock-away'));
  addEventListener('resize', () => { scrollDirty = true; wake(); });
  document.addEventListener('visibilitychange', wake);
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || CW.still) return; CW.px.t = e.clientX / innerWidth - .5; CW.py.t = e.clientY / innerHeight - .5; CW.pointer = [e.clientX, e.clientY]; wake(); }, { passive: true });
  CW.intro.t = 1;

  /* ---------- Interface: header menus ---------- */
  const dds = $$('.dd');
  const closeAll = (except) => dds.forEach(d => { if (d !== except && d.classList.contains('open')) { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); } });
  const openDd = (d, focusFirst) => { closeAll(d); d.classList.add('open'); $('button', d).setAttribute('aria-expanded', 'true'); if (focusFirst) $('.menu a', d)?.focus(); };
  dds.forEach(d => {
    const b = $('button', d); let t;
    b.addEventListener('click', () => d.classList.contains('open') ? closeAll() : openDd(d));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openDd(d, true); } });
    d.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; clearTimeout(t); t = setTimeout(() => openDd(d), 80); });
    d.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; clearTimeout(t); t = setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 220); });
    d.addEventListener('keydown', e => {
      const links = $$('.menu a', d), k = links.indexOf(document.activeElement);
      if (e.key === 'Escape') { closeAll(); b.focus(); }
      else if (k >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); links[(k + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus(); }
    });
    d.addEventListener('focusout', () => setTimeout(() => { if (!d.contains(document.activeElement)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }, 0));
  });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.dd')) closeAll(); });

  /* ---------- Mobile sheet ---------- */
  const burger = $('#burger'), sheet = $('#sheet');
  const setSheet = (open) => { sheet.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu'); root.classList.toggle('sheet-open', open); if (open) $('a', sheet).focus(); };
  burger.addEventListener('click', () => setSheet(sheet.hidden));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setSheet(false); });
  $$('.grp > button', sheet).forEach(b => b.addEventListener('click', () => { const s = $('#' + b.getAttribute('aria-controls')), o = s.hidden; s.hidden = !o; b.setAttribute('aria-expanded', String(o)); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); } });
  matchMedia('(min-width: 1240px)').addEventListener?.('change', e => { if (e.matches) setSheet(false); });

  /* ---------- Pointer glow and field highlights ---------- */
  $$('.plan, .way').forEach(p => p.addEventListener('pointermove', e => { const r = p.getBoundingClientRect(); p.style.setProperty('--mx', (e.clientX - r.left) + 'px'); p.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));
  const lite = (slot, k) => { CW.hi[slot] = k; CW.dirty = true; wake(); };
  $$('.plan').forEach(p => { const k = +p.dataset.plan; ['pointerenter', 'focusin'].forEach(ev => p.addEventListener(ev, () => lite(1, k))); ['pointerleave', 'focusout'].forEach(ev => p.addEventListener(ev, () => lite(1, -1))); });
  $$('.way').forEach(w => { const k = +w.dataset.way;
    w.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') lite(2, k); }); w.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') lite(2, -1); });
    w.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const on = !w.classList.contains('on'); $$('.way.on').forEach(x => x.classList.remove('on')); w.classList.toggle('on', on); lite(2, on ? k : -1); }); });

  /* ---------- Footer: copy numbers, live-site services, back to top ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const done = t => { b.textContent = t; setTimeout(() => b.textContent = 'Copy', 1600); };
    const fb = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected'); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(() => done('Copied'), fb); } catch { fb(); }
  }));
  $$('.pop > button').forEach(b => { const tip = $('#' + b.getAttribute('aria-controls'));
    b.addEventListener('click', () => { const o = tip.hidden; $$('.pop .tip').forEach(t => t.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); tip.hidden = !o; b.setAttribute('aria-expanded', String(o)); }); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop')) { $$('.pop .tip').forEach(t => t.hidden = true); $$('.pop > button').forEach(x => x.setAttribute('aria-expanded', 'false')); } });
  totop.addEventListener('click', () => { scrollTo({ top: 0, behavior: CW.still ? 'auto' : 'smooth' }); $('#top .brand').focus({ preventScroll: true }); });

  applyStill();
})();
