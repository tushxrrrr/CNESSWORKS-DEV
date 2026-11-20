#!/usr/bin/env node
// Deployment checks for the Next.js export (run against `npm run serve`, which behaves like a production host):
//  - every page loads at /route and /route/ with no failed request (images, fonts, scripts) and no console error;
//  - nothing is requested from a third party at load (fonts are self-hosted; only links point elsewhere);
//  - favicon, canonical URL and noindex are present;
//  - certification pages: no page is prefetched until a visitor shows intent; a page switch jumps to the top of the
//    new page instead of gliding;
//  - CNESS Advantage: the particle field survives a lost WebGL context (2D drawing takes over, WebGL returns).
// Usage: node tools/test-deploy.js [base URL]   (default http://localhost:3100; include the base path if the build used one)
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/$/, ''), ORIGIN = new URL(BASE).origin;
const PAGES = ['cness-advantage', 'mother-of-certification', 'cness-certification', 'product-certification', 'analyze'];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

(async () => {
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const route of PAGES) for (const slash of ['', '/']) {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    const failed = [], third = [], errors = [];
    p.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(ORIGIN, '')}`); });
    p.on('requestfailed', r => failed.push(`failed ${r.url().replace(ORIGIN, '')}`));
    p.on('request', r => { if (!r.url().startsWith(ORIGIN) && !r.url().startsWith('data:')) third.push(r.url()); });
    p.on('console', m => m.type() === 'error' && errors.push(m.text())); p.on('pageerror', e => errors.push(e.message));
    await p.goto(`${BASE}/${route}${slash}`, { waitUntil: 'networkidle' });
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });   // lazy images too
    await p.waitForTimeout(600);
    const head = await p.evaluate(() => ({ icon: !!document.querySelector('link[rel="icon"]'), canonical: document.querySelector('link[rel="canonical"]')?.href, robots: document.querySelector('meta[name="robots"]')?.content,
      images: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map(i => i.getAttribute('src')),
      fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((f, i, a) => a.indexOf(f) === i).sort().join(', ') }));
    ok(!failed.length && !head.images.length, `${route}${slash}: every request succeeds ${failed.concat(head.images).slice(0, 4).join(' | ')}`);
    ok(!third.length, `${route}${slash}: no third-party requests ${third.slice(0, 3).join(' | ')}`);
    ok(!errors.length, `${route}${slash}: no console errors ${errors.slice(0, 2).join(' | ')}`);
    if (!slash) {
      ok(head.icon && head.canonical === `https://www.cnessworks.com/${route}` && /noindex/.test(head.robots || ''), `${route}: favicon, canonical ${head.canonical}, robots "${head.robots}"`);
      ok(/DM Mono/.test(head.fonts) && /Fraunces/.test(head.fonts) && /Onest/.test(head.fonts), `${route}: web fonts loaded from the app (${head.fonts})`);
    }
    await p.close();
  }

  // certification: prefetch on intent only; page switch lands at the top at once
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } }); const rsc = [];
    p.on('request', r => { if (/\.txt(\?|$)/.test(r.url()) || r.headers()['rsc']) rsc.push(r.url().replace(ORIGIN, '')); });
    await p.goto(`${BASE}/mother-of-certification`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    ok(rsc.length === 0, `certification: nothing prefetched at load (${rsc.length} requests)`);
    await p.hover('.switch a[data-route="product-certification"]'); await p.waitForTimeout(800);
    ok(rsc.some(u => u.includes('product-certification')), 'certification: hovering a page link prefetches that page');
    await p.evaluate(() => scrollTo(0, 2600)); await p.waitForTimeout(400); await p.evaluate(() => scrollTo(0, 2560)); await p.waitForTimeout(600);   // a small scroll up brings the switcher back, as for a visitor
    await p.click('.switch a[data-route="product-certification"]');
    const ys = []; for (let i = 0; i < 6; i++) { await p.waitForTimeout(60); ys.push(Math.round(await p.evaluate(() => scrollY))); }
    const firstAtTop = ys.findIndex(y => y === 0), afterTop = ys.slice(firstAtTop);
    ok(firstAtTop >= 0 && afterTop.every(y => y === 0) && !ys.slice(0, Math.max(0, firstAtTop)).some((y, i, a) => i && y < a[i - 1] && y > 0), `certification: page switch jumps to the top (${ys.join(' ')})`);
    await p.close();
  }

  // Advantage: lose the WebGL context, keep a field on screen, get WebGL back
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } }); const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(`${BASE}/cness-advantage`, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    const gl = await p.evaluate(() => !!window.__webgl);
    const state = () => p.evaluate(() => { const gl = document.querySelector('#field canvas:not(#f2d)'), c2 = document.getElementById('f2d');
      return { glShown: !!gl && getComputedStyle(gl).display !== 'none', f2dShown: getComputedStyle(c2).display !== 'none' }; });
    await p.evaluate(() => { const c = document.querySelector('#field canvas:not(#f2d)'); window.__lose = c.getContext('webgl2').getExtension('WEBGL_lose_context'); window.__lose.loseContext(); });
    await p.waitForTimeout(800); const lost = await state();
    // the 2D field draws: read a pixel area of the fallback canvas
    const drawn = await p.evaluate(() => { const c = document.getElementById('f2d'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4 * 97) if (x[i]) n++; return n; });
    await p.evaluate(() => window.__lose.restoreContext()); await p.waitForTimeout(1200); const back = await state();
    ok(gl && lost.f2dShown && !lost.glShown && drawn > 0, `Advantage: on WebGL context loss the 2D field takes over (${drawn} sampled pixels drawn)`);
    ok(back.glShown && !back.f2dShown, 'Advantage: WebGL takes over again when the context is restored');
    ok(!errors.length, 'Advantage: no script errors around context loss ' + errors.join(' | '));
    await p.close();
  }
  console.log(`${pass} passed, ${fail} failed`); await br.close(); process.exit(fail ? 1 : 0);
})();
