# CNESSWORKS (development)

The approved CNESSWORKS page designs, signed off on 20 November 2026 (git tag `approved-2026-11-20`).
This repository is the starting point for the production build (Next.js + TypeScript; see "Next.js app" below). The earlier test
repository (tushxrrrr/cnessworks) keeps the full design history, including the unapproved variants.

| Page | Built file | Source | Approved |
| --- | --- | --- | --- |
| First Light (landing page) | `immersive.html` | `src/immersive.html` | 20 Nov 2026 |
| CNESS Advantage | `advantage.html` | `src/advantage.html` (generated) | 20 Nov 2026 |
| Certification (Mother of Certification, Organization, Product) | `certification.html` | `src/certification.html` (generated) | 20 Nov 2026 |
| Analyze (Organization and Product paths) | `analyze.html` | `src/analyze.html` (generated) | 20 Nov 2026 |

Each approved version was compared with its source file at seeding: all four are identical.

- **Build.** Pages are body fragments in `src/`; `./build.sh` wraps them into the root `*.html` files. Advantage, Certification and Analyze are generated from the locked content in `content/` by `tools/build-*.py`; never edit their `src/*.html` by hand.
- **Verify.** `node tools/verify-advantage.js`, `node tools/verify-certification.js`, `node tools/verify-analyze.js` and `node tools/test-analyze.js` (Playwright). The `*-source.js` tools re-check the content against the live site (read-only; the Analyze check blocks every non-GET request).
- **Search engines.** `robots.txt` and the `noindex` meta tag keep this site out of search engines. Remove both only at go-live.
- **Known live-site text issue.** Two Product pillar descriptions on the live Analyze page contain a broken dash ("productâ€”not", "lifecycleâ€”from"). Under the content lock they are reproduced verbatim in `content/analyze.json`; fix them on the live site, then re-capture.

## Next.js app (production build, in progress)
The approved pages are being ported to **Next.js 16 (App Router) with strict TypeScript**, one page at a time. A page counts as ported only when the Next.js version passes the same checks as the approved static page.

| Page | Next.js route | Status |
| --- | --- | --- |
| Analyze | `/analyze` (`app/analyze/page.tsx`) | Ported and verified |
| First Light | | To do |
| CNESS Advantage | | To do |
| Certification (three pages) | | To do |

- **Run.** `npm install`, then `npm run dev` (http://localhost:3000/analyze). `npm run build` writes a static export to `out/` (`out/analyze.html`): plain HTML, CSS and JS that can be hosted anywhere or handed over as files. `npm run serve` serves `out/` at http://localhost:3100. `npm run typecheck` runs `tsc`.
- **Structure.** `app/` routes; `components/site/` the shared header, mobile menu, footer and quick actions (`SiteChrome.tsx`) and their behaviour (`ChromeBehaviour.tsx`); `components/analyze/` the Analyze page (`AnalyzeApp.tsx`: paths, steps, ratings, form, preview disclosure; `RouteBand.tsx`: the survey-terrain graphic); `lib/content.ts` typed access to the locked content; `lib/analyze/validation.ts` the live page's field rules.
- **Content.** Components read the same locked inventories as the static pages (`content/*.json`); no copy is typed into components. The terrain graphic's geometry comes from `lib/analyze/graphic.json`, written by `python3 tools/export-analyze-graphic.py` from the same generator as the static page.
- **Styles and assets.** The approved stylesheets are imported as they are (`src/advantage/style.css`, `src/analyze/style.css`). `assets/` stays the single source for images; `scripts/sync-assets.mjs` copies it (and `robots.txt`) into `public/` before `dev` and `build`.
- **Choices that keep the approved quality.** Fonts load from Google Fonts as on the approved pages (not `next/font`), so the tuned fallback faces still prevent text re-wrapping on load. Animation stays in CSS (transform and opacity) and the graphic's lens is positioned from measured layout, not re-rendered per frame. The page's sections are memoised so a click re-renders only what changed. Browser storage and the address hash are read after the page loads, so server and browser render the same markup.
- **Verified (Analyze, against `npm run build` + `npm run serve`).** `node tools/verify-analyze.js http://localhost:3100/analyze`: all 515 approved strings and the shared chrome, no differences. `node tools/test-analyze.js http://localhost:3100/analyze`: 45 of 45 behaviour checks. axe-core: no WCAG 2.2 AA violations (five states per path, desktop and phone). No horizontal overflow at 1440, 768, 390 and 320 px. Load layout shift 0.001. Scrolling at 60 fps with the CPU slowed 4x. Screenshots of four states at desktop and phone width match the approved static page pixel for pixel, apart from anti-aliasing on one heading (under 0.005% of pixels). Clicks cost about 2-3 ms more script time than the static page at normal CPU speed (React's own work); no long tasks.
- **Tests need Playwright** (`npm i -D playwright && npx playwright install chromium` on a new machine) and, for the accessibility check, axe-core.
- **Not connected to CNESS.** As in the approved preview, a valid submit opens a "Preview only" disclosure. Connecting the form to the live service needs the CNESS endpoint and its owners' approval.

## First Light (`immersive.html`)
A cinematic, condensed version of the same content. Copy is shortened but every statement comes from CONTENT.md.
- One fixed WebGL field of particles (36,000 on desktop, 14,000 on phones) sits behind the whole page. Each particle has eight stored positions, one per formation: nebula, six-facet lens, wave, five-node helix, three rings, heptagon, globe, sun. The vertex shader blends between them from a single `uScene` value, so a chapter change is a morph, not a cut.
- Chapters are `.ch[data-scene]` sections. Each pins for `--len` viewports; `layout()` in the main script turns scroll position into the scene value (held while pinned, blended over the last viewport before the next chapter), the per-chapter `--p` progress, and the active step. Steps (`[data-step]`) light the matching facet, node, ring or vertex through `CW.hi`.
- Other scroll-driven pieces: the horizontal "Four ways" track, rising headline lines, the word-by-word statement, the sky colour, and the final sunrise (a `clip-path` circle that takes the page from night to day).
- Formations, colours, placement and spin are plain data at the top of the main script (`CW.forms`, `CW.colA/colB`, `CW.rig`, `CW.spin`). The Canvas 2D fallback (`draw2d`) draws the same data when WebGL or the CDN is unavailable.
- Pause motion and `prefers-reduced-motion` stop time-based motion and make scene changes snap; scrolling still moves between chapters. It keeps the `noindex` tag.

## CNESS Advantage subpage (`advantage.html`)
The first subpage, in First Light's design family (night field, Fraunces / Onest / DM Mono, gold accents, springs). Its content is the live page https://www.cnessworks.com/cness-advantage, locked word for word.
- **Content lock.** `content/cness-advantage.json` holds every approved item from the live page in reading order (217 main items, plus header, footer and quick-action labels and destinations), captured from the live DOM on 19 Nov 2026. Do not edit it by hand: re-capture it when the live page changes.
- **Build.** `python3 tools/build-advantage.py` writes `src/advantage.html` from that JSON plus `src/advantage/style.css`, `motion.js` and `field.js`; then `./build.sh` wraps it into `advantage.html`. The generator stops if the live structure no longer matches what it expects. Never edit `src/advantage.html` directly.
- **Verify.** `node tools/verify-advantage.js` renders the page and compares every `[data-c]` item, link destination, header, footer and quick action with the JSON (exit 1 on any difference). Run it after every build.
- **Motion.** One fixed particle field re-forms into each offering's emblem as its section arrives: trust card, six-facet lens (six areas), three rings (levels; the current level lights up), product box with a check, globe, two plan rings sharing a core, partner network, ripples, a hub with six links (lighting the one you point at or tap), then the closing sun. Sections are content-height; nothing is pinned. Text settles in from a visible state; reduced motion and the pause button show everything at rest.
- **Not reproduced.** The live site's website assistant (chat widget) and WhatsApp community dialog cannot run in a static preview: the footer's Online Chat and WhatsApp buttons open a short note linking to cnessworks.com instead.

## Certification section (`certification.html`)
The Certification navigation and its three pages in one preview, on the same system as the Advantage subpage (shared tokens, header, footer and buttons). A page switcher under the header moves between the three pages (it steps aside while reading down and returns on the way up).
- **Routes.** One document, three pages, addressed by hash: `#mother-of-certification`, `#cness-certification`, `#product-certification` (the production paths `/mother-of-certification`, `/cness-certification`, `/product-certification`). Any section id also works (`#org-faq` opens Organization Certification at its FAQ). Every link between the three pages carries its production URL in `data-prod-href`; all other links keep their live destinations. Back, forward, reload and direct links work; focus moves to the new page's heading after a page change.
- **Content lock.** `content/mother-of-certification.json`, `content/cness-certification.json` and `content/product-certification.json` hold each page's approved content, captured from the live pages on 19 Nov 2026, including states that only render on interaction: the full 95-row industry table (all regions, expanded), the six pillar dialogs, both spotlight testimonials and all twelve FAQ answers (from the site's FAQ API). Each file lists what was deliberately not reproduced under `omitted`.
- **Build.** `python3 tools/build-certification.py` writes `src/certification.html`; `./build.sh` wraps it into `certification.html`.
- **Verify.** `node tools/verify-certification.js` checks every element against its own page's inventory (text, link labels, production URLs, routing), that nothing approved is missing, reading order, and the shared chrome. `node tools/verify-certification-source.js` re-checks the inventories against the live pages.
- **Interactions.** Mother of Certification: region filters, search (any column except Region, as on the live page), Show more / Show less. Organization Certification: pillar dialogs with previous / next (opened from the pillar cards, the hero pillar chips or the wheel), testimonial carousel, FAQ tabs and answers, step progress. Product Certification: pillars, evidence list and opportunities light their part of each graphic.
- **Graphics (one set per page, inline SVG and CSS, no WebGL).** Mother of Certification: a canopy that light falls onto, a dotted world map that lights the region chosen in the industry filter (data: `tools/data/worldmap.json`, made by `tools/gen-worldmap.js` from Natural Earth), two framework rings moving inside one. Organization Certification: six columns of light tied to the pillar chips, a pillar wheel that turns the focused pillar to the top, bars that rise once, a runner on the step line, levels set as a staircase. Product Certification: a product turning inside a ring of 108 places, an invitation that opens, seven petals for the seven pillars, a fanned document stack, a six-way hub. Each page has its own static sky.
- **Smoothness.** Everything animated is transform or opacity. Arrivals and graphic playback come from IntersectionObservers (graphics pause off screen); scroll work is one requestAnimationFrame per frame (progress bar, step runners); no backdrop blur sits over moving content. Measured while scrolling every page top to bottom with the CPU slowed 4×: 60 fps average, 95th-percentile frame 16.8 ms, at most 2 frames over 33 ms per page (1440×900 and 390×844). The headline fallback font is sized to Fraunces so lines don't re-wrap when the web font arrives (load layout shift 0.003–0.006).

## Analyze page (`analyze.html`)
The Analyze page with both paths, Organization and Product, on the shared CNESSWORKS system (tokens, header, footer, buttons). Source `src/analyze.html`, generated by `python3 tools/build-analyze.py` from `content/analyze.json`; `./build.sh` wraps it into `analyze.html`. Paths are addressed as `#organization` and `#product`.
- **Content lock.** `content/analyze.json` holds every approved string, captured from the live page on 20 Nov 2026: visible text, the page's English i18n strings, and the component's own strings for states that render only on interaction (validation, busy labels, confirmation). It also records the live rules (rating, progress, validation, retention, submission) and what was not reproduced (`omitted`).
- **Flow (as live).** Rate each pillar 1 to 10 (one value, nothing preselected, Next disabled until rated). Progress reads "Pillar n of N" and round(index / N × 100)% completed. Back keeps earlier ratings. On the last pillar "See result" opens the details form; no score is shown on the page. Validation follows the live rules: required fields, a deliverable email, and an http(s) website (required for Product, optional for Organization); the live messages and the first invalid field gets focus. Each path keeps its own ratings, step and fields, including across reloads (browser storage).
- **Preview limits.** Not connected to the CNESS service. A valid submit opens a disclosure ("Preview only") instead of sending; from there the confirmation screen can be viewed, tagged "Preview: not submitted". Additions: a Back button on the form (returns to the last pillar, ratings kept), and Analyze Another clears only the current path (live also empties the other path's form fields).
- **Graphic.** A survey terrain: contour lines, one waypoint per pillar on a trail that ends at the details step, and a lens that magnifies the current waypoint. Waypoints show only whether you have rated a pillar, never the rating. Transform/opacity only; pauses off screen, under reduced motion and with the pause button.
- **Verify.** `node tools/verify-analyze.js` (every element against the inventory, nothing missing, shared chrome, preview text listed separately), `node tools/test-analyze.js` (both paths: rules, progress, retention, validation, no network on submit), `node tools/verify-analyze-source.js` (re-checks the inventory against the live page with every non-GET request blocked).

## Standalone HTML files (`dist/`)
Single-file versions of the pages, ready to hand over or open directly in a browser:
- `dist/cnessworks-first-light.html`: First Light.
- `dist/cnessworks-advantage.html`: the CNESS Advantage subpage.
- `dist/cnessworks-certification.html`: the Certification section (three pages).
- `dist/cnessworks-analyze.html`: the Analyze page (Organization and Product paths).

Each file is a complete HTML document with every image (logo, level emblems, CNESS mark) embedded as a data URI, so it needs no `assets/` folder. Two things still load from the internet: the Google Fonts stylesheet, and three.js from jsDelivr for the WebGL particles (not used by the Certification file, which has no WebGL). Without three.js the pages fall back to the Canvas 2D drawing; without the fonts they use the fallback faces.

To regenerate after editing any source, run `./build.sh`, then:
```
python3 - <<'EOF'
import base64, re
    s = open(src, encoding='utf-8').read()
    for a in sorted(set(re.findall(r'assets/[\w./-]+\.(?:png|svg|webp|jpg)', s))):
        mime = {'svg': 'image/svg+xml', 'png': 'image/png', 'webp': 'image/webp', 'jpg': 'image/jpeg'}[a.rsplit('.', 1)[1]]
        s = s.replace(a, f"data:{mime};base64," + base64.b64encode(open(a, 'rb').read()).decode())
    open(out, 'w', encoding='utf-8').write(s)
EOF
```
