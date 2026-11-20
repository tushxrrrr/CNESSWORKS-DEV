#!/usr/bin/env python3
"""Builds src/analyze.html: the Analyze page (Organization and Product self-assessment paths).

Content (locked, captured from the live page, never edited by hand): content/analyze.json
Site chrome: tools/site_chrome.py (labels and destinations from content/cness-advantage.json)
Presentation: src/advantage/style.css (shared system) + src/analyze/style.css
Behaviour: src/analyze/app.js (paths, pillar steps, ratings, details form, validation; preview-only submission)

Every approved string is copied verbatim from the JSON and tagged data-k="<json path>", so
tools/verify-analyze.js can resolve each element back to the inventory. Strings used only by script
(validation messages, busy labels, progress templates) are embedded verbatim as JSON in #an-copy.
Text that is not approved copy (the preview disclosure) is marked data-preview.
The signature graphic (survey terrain, trail, waypoints, lens) is generated here, deterministically.
"""
import json, html, math, pathlib, random, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from site_chrome import build as chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
rd = lambda p: (ROOT / p).read_text(encoding='utf-8')
C = json.loads(rd('content/analyze.json'))
E = lambda s: html.escape(s, quote=True)
def K(*path): return f' data-k="{".".join(str(p) for p in path)}"'
ARR = '<span class="arr" aria-hidden="true">→</span>'
TRACKS = ['organization', 'product']

# ---------------- Signature graphic: survey terrain ----------------
def terrain():
    """Contour lines of a few hills (viewBox 1600x400, drawn with xMidYMid slice)."""
    rnd = random.Random(20261120)
    hills = [(150, 250, 210, 7), (470, 120, 170, 6), (760, 300, 230, 8), (1040, 110, 190, 7), (1330, 260, 220, 8), (1560, 70, 150, 5), (300, -20, 140, 4)]
    paths = []
    for hx, hy, R, rings in hills:
        ph = [rnd.uniform(0, 6.283) for _ in range(4)]; amp = [rnd.uniform(.05, .12), rnd.uniform(.03, .08), rnd.uniform(.02, .05)]
        sx, sy = rnd.uniform(1.15, 1.6), rnd.uniform(.55, .8)
        for k in range(1, rings + 1):
            f = k / rings; pts = []
            for j in range(40):
                t = j / 40 * 2 * math.pi
                w = 1 + amp[0] * math.sin(2 * t + ph[0] + f) + amp[1] * math.sin(3 * t + ph[1] - f * 1.3) + amp[2] * math.sin(5 * t + ph[2] + f * 2)
                r = R * f * w
                pts.append((hx + math.cos(t) * r * sx, hy + math.sin(t) * r * sy))
            mids = [((pts[i][0] + pts[(i + 1) % 40][0]) / 2, (pts[i][1] + pts[(i + 1) % 40][1]) / 2) for i in range(40)]
            d = f'M{mids[-1][0]:.0f} {mids[-1][1]:.0f}' + ''.join(f'Q{pts[i][0]:.0f} {pts[i][1]:.0f} {mids[i][0]:.0f} {mids[i][1]:.0f}' for i in range(40)) + 'Z'
            paths.append(f'<path class="{"ix" if k % 3 == 0 else "ct"}" d="{d}"/>')
    return ''.join(paths)

WAY = {  # waypoint positions in % of the route band (x, y); the last point is the details step
    'organization': [(9, 62), (22, 34), (36, 58), (50, 30), (63, 60), (76, 36), (91, 52)],
    'product': [(8, 40), (19, 66), (31, 38), (43, 64), (55, 34), (67, 62), (79, 36), (92, 54)],
}
def seg_paths(pts):
    """One path per leg (start -> wp1, wp1 -> wp2, ...), Catmull-Rom smoothed, in a 0-100 box."""
    P = [(1, pts[0][1] + 6)] + pts
    out = []
    for i in range(len(P) - 1):
        p0 = P[max(0, i - 1)]; p1 = P[i]; p2 = P[i + 1]; p3 = P[min(len(P) - 1, i + 2)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append(f'M{p1[0]} {p1[1]}C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]} {p2[1]}')
    return out

def route(track, n):
    pts = WAY[track]; segs = seg_paths(pts)
    base = ''.join(f'<path class="leg-bg" pathLength="1" d="{d}"/>' for d in segs)
    lit = ''.join(f'<path class="leg" data-leg="{i}" pathLength="1" d="{d}"/>' for i, d in enumerate(segs))
    trail = f'<svg class="trail" viewBox="0 0 100 100" preserveAspectRatio="none">{base}{lit}</svg>'
    land = '<svg class="land" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMid slice"><use href="#terrain"/></svg>'
    wps = ''.join(f'<i class="wp" data-w="{i}" style="--x:{x}%;--y:{y}%"><b>{i + 1:02d}</b></i>' for i, (x, y) in enumerate(pts[:n]))
    sx, sy = pts[n]
    summit = f'<i class="wp summit" data-w="{n}" style="--x:{sx}%;--y:{sy}%"><svg viewBox="0 0 24 24"><path d="M4 7h16v11H4z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></i>'
    lens = f'<span class="lens"><span class="lens-in"><span class="lens-map">{land}{trail}</span></span></span>'
    north = '<svg class="north" viewBox="0 0 24 24"><path d="M12 3l4 10-4-2.4L8 13z" fill="currentColor"/><path d="M9.5 21v-5l5 5v-5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
    return f'<div class="route" aria-hidden="true"><div class="drift">{land}</div>{trail}{wps}{summit}{lens}{north}</div>'

# ---------------- Path tabs ----------------
TAB_ICON = {
  'organization': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 21V5.5L12 3v18M12 8h8v13M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2M3 21h18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'product': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
}
def tabs():
    out = []
    for i, t in enumerate(TRACKS):
        n = len(C['tracks'][t]['pillars'])
        dots = '<span class="mini" aria-hidden="true">' + '<i></i>' * n + '<i class="s"></i></span>'
        out.append(f'<button type="button" role="tab" id="tab-{t}" aria-controls="panel-{t}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}" data-track="{t}">'
                   f'<span class="ti">{TAB_ICON[t]}</span><span class="tl"{K("tabs", t)}>{E(C["tabs"][t])}</span>{dots}</button>')
    return f'<div class="paths" role="tablist" aria-label="Analyze">{"".join(out)}<span class="glide" aria-hidden="true"></span></div>'

# ---------------- One path ----------------
def field(t, f, j):
    P = ('tracks', t, 'form', 'fields', j); fid = 'an-' + f['id']
    req = f.get('required')
    lab = f['label']
    if req:  # live: label text without the trailing asterisk, then an aria-hidden red asterisk
        base = lab.rstrip(' *')
        label = f'<label for="{fid}"><span{K(*P, "label")} data-label-base="{E(base)}">{E(base)} <span class="req" aria-hidden="true">*</span></span></label>'
    else:
        label = f'<label for="{fid}"><span{K(*P, "label")}>{E(lab)}</span></label>'
    common = f'id="{fid}" name="{f["key"]}" data-key="{f["key"]}"' + (' aria-required="true"' if req else '')
    ph = f' placeholder="{E(f["placeholder"])}" data-kp="{".".join(map(str, P))}.placeholder"' if f.get('placeholder') else ''
    if f.get('type') == 'textarea': ctl = f'<textarea {common} rows="4"{ph}></textarea>'
    elif f.get('type') == 'select':
        opts = ''.join(f'<option value="{E(o)}"{K(f["options"], k)}>{E(o)}</option>' for k, o in enumerate(C[f['options']]))
        ctl = f'<select {common}><option value=""{K(*P, "empty")}>{E(f["empty"])}</option>{opts}</select>'
    else:
        typ = 'email' if f.get('type') == 'email' else 'text'
        extra = ' autocomplete="email" inputmode="email"' if typ == 'email' else (' autocomplete="organization"' if f['key'] == 'org_name' else (' inputmode="url" autocomplete="url"' if f['key'] == 'website' else ''))
        ctl = f'<input type="{typ}" {common}{ph}{extra}>'
    cls = 'fld' + (' half' if f.get('type') == 'select' else '') + (' wide' if f.get('type') == 'textarea' else '')
    return f'<div class="{cls}">{label}{ctl}</div>'

def panel(t, i):
    T = C['tracks'][t]; S = C['scorer']; n = len(T['pillars']); P = ('tracks', t)
    pills = []
    for j, p in enumerate(T['pillars']):
        desc = ''.join(f'<p{K(*P, "pillars", j, "paragraphs", m)}>{E(x)}</p>' for m, x in enumerate(p['paragraphs']))
        pills.append(f'''<article class="pillar" id="{t}-p{j + 1}" data-i="{j}" aria-labelledby="{t}-p{j + 1}-h"{"" if j == 0 else " hidden"}>
        <h3 id="{t}-p{j + 1}-h" tabindex="-1">Pillar {j + 1} — <span{K(*P, "pillars", j, "name")}>{E(p["name"])}</span></h3>
        <p class="sum"{K(*P, "pillars", j, "summary")}>{E(p["summary"])}</p>
        <div class="desc">{desc}</div>
      </article>''')
    scale = ''.join(f'<button type="button" role="radio" aria-checked="false" tabindex="{0 if v == 1 else -1}" data-v="{v}">{v}</button>' for v in range(1, 11))
    F = T['form']
    fields = ''.join(field(t, f, j) for j, f in enumerate(F['fields']))
    note = f'<p class="note"{K(*P, "form", "note")}>{E(F["note"])}</p>' if F.get('note') else ''
    N = C['notice']
    el = T['eligibility']
    intro = f'<p class="lede"{K(*P, "eligibility", "intro")}>{E(el["intro"])}</p>' if el.get('intro') else ''
    erows = ''.join(f'<tr><td{K(*P, "eligibility", "rows", r, 0)}>{E(a)}</td><td{K(*P, "eligibility", "rows", r, 1)}>{E(b)}</td></tr>' for r, (a, b) in enumerate(el['rows']))
    cv = T['coverage']
    crows = ''.join(f'<tr><th scope="row"><span class="no" aria-hidden="true">{r + 1:02d}</span><span{K(*P, "coverage", "rows", r, 0)}>{E(a)}</span></th><td{K(*P, "coverage", "rows", r, 1)}>{E(b)}</td></tr>' for r, (a, b) in enumerate(cv['rows']))
    ex = T['expect']; ce = T['certification']
    expect = ''.join(f'<p{K(*P, "expect", "body", m)}>{E(x)}</p>' for m, x in enumerate(ex['body']))
    return f'''<section class="panel" role="tabpanel" id="panel-{t}" aria-labelledby="tab-{t}" data-track="{t}" data-n="{n}"{"" if i == 0 else " hidden"}>
  <div class="wrap an-head">
    <h1 id="h1-{t}" tabindex="-1"{K(*P, "heroTitle")}>{E(T["heroTitle"])}</h1>
    <p class="lede"{K(*P, "heroSubtitle")}>{E(T["heroSubtitle"])}</p>
  </div>
  <div class="wrap">
    <div class="inst" id="inst-{t}" data-phase="scoring">
      {route(t, n)}
      <div class="inst-head">
        <div class="who"><p class="k2"{K(*P, "trackLabel")}>{E(T["trackLabel"])}</p><h2 class="subj"><span class="fb"{K(*P, "subjectFallback")}>{E(T["subjectFallback"])}</span><span class="nm" hidden></span></h2></div>
        <div class="prog"><p class="pt">Pillar <span class="pn">1</span> of {n}</p><p class="pc"><span class="pv">0</span>% completed</p><span class="pbar" aria-hidden="true"><i></i></span></div>
      </div>
      <div class="work">
        <div class="steps">{"".join(pills)}</div>
        <aside class="rate" aria-label="{E(T["rateLabel"])}">
          <p class="rh"{K(*P, "rateLabel")}>{E(T["rateLabel"])}</p>
          <div class="readout"><p class="k3"{K("scorer", "yourRating")}>{E(S["yourRating"])}</p><p class="big"><span class="val"{K("scorer", "none")}>{S["none"]}</span><span class="of">/<span{K("scorer", "outOf")}>{S["outOf"]}</span></span></p></div>
          <div class="scale" role="radiogroup" aria-label="Rate {E(T["pillars"][0]["name"])}">{scale}<span class="mark" aria-hidden="true"></span></div>
          <div class="ends"><span{K("scorer", "scaleLow")}>{E(S["scaleLow"])}</span><span{K("scorer", "scaleHigh")}>{E(S["scaleHigh"])}</span></div>
          <div class="acts"><button type="button" class="btn ghost back" hidden><span class="arr" aria-hidden="true">←</span> <span{K("scorer", "back")}>{E(S["back"])}</span></button><button type="button" class="btn next" disabled data-next="{E(S["next"])}" data-finish="{E(S["finish"])}"><span class="nl"{K("scorer", "next")}>{E(S["next"])}</span> {ARR}</button></div>
        </aside>
        <form class="details" novalidate hidden aria-labelledby="{t}-form-h">
          <div class="fh"><h2 id="{t}-form-h" tabindex="-1"{K(*P, "form", "heading")}>{E(F["heading"])}</h2><p class="lede"{K(*P, "form", "intro")}>{E(F["intro"])}</p>{note}</div>
          <div class="grid">{fields}</div>
          <div class="err" role="alert" hidden><b></b> <span></span></div>
          <div class="acts"><button type="button" class="btn ghost back-form"><span class="arr" aria-hidden="true">←</span> {E(S["back"])}</button><button type="submit" class="btn submit" data-busy="{E(F["busy"])}"><span{K(*P, "form", "submit")}>{E(F["submit"])}</span> {ARR}</button></div>
        </form>
        <section class="notice" hidden aria-labelledby="{t}-notice-h">
          <p class="pv-tag" data-preview>Preview: not submitted. This copy of the page is not connected to CNESS, so nothing was sent.</p>
          <span class="tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <p class="k2"{K("notice", "kicker")}>{E(N["kicker"])}</p>
          <h2 id="{t}-notice-h" tabindex="-1"{K("notice", "h2")}>{E(N["h2"])}</h2>
          <p class="lede"{K("notice", "p")}>{E(N["p"])}</p>
          <div class="facts"><div><p class="k3"{K("notice", "sentTo")}>{E(N["sentTo"])}</p><p class="mail"></p></div><div><p class="k3"{K("notice", "when")}>{E(N["when"])}</p><p{K("notice", "whenBody")}>{E(N["whenBody"])}</p></div></div>
          <p{K("notice", "next")}>{E(N["next"])}</p>
          <div class="acts"><button type="button" class="btn ghost again"{K("notice", "another")}>{E(N["another"])}</button><a class="btn" href="{E(N["explore"][t])}" data-prod-href="{E(N["explore"][t])}" target="_blank" rel="noopener"{K("notice", "explore", "text")}>{E(N["explore"]["text"])} {ARR}</a></div>
        </section>
      </div>
    </div>
  </div>
  <div class="wrap info">
    <section class="elig" aria-labelledby="{t}-elig-h">
      <h2 id="{t}-elig-h"{K(*P, "eligibility", "heading")}>{E(el["heading"])}</h2>{intro}
      <div class="tblw" role="region" aria-labelledby="{t}-elig-h" tabindex="0"><table><thead><tr><th scope="col" class="ok"{K(*P, "eligibility", "eligibleHeader")}>{E(el["eligibleHeader"])}</th><th scope="col" class="no"{K(*P, "eligibility", "ineligibleHeader")}>{E(el["ineligibleHeader"])}</th></tr></thead><tbody>{erows}</tbody></table></div>
      <p class="low"{K(*P, "eligibility", "lowScoreNote")}>{E(el["lowScoreNote"])}</p>
    </section>
    <div class="cov-row">
      <section class="cover" aria-labelledby="{t}-cov-h">
        <h2 id="{t}-cov-h"{K(*P, "coverage", "heading")}>{E(cv["heading"])}</h2>
        <div class="tblw" role="region" aria-labelledby="{t}-cov-h" tabindex="0"><table><thead><tr><th scope="col"{K(*P, "coverage", "pillarHeader")}>{E(cv["pillarHeader"])}</th><th scope="col"{K(*P, "coverage", "focusHeader")}>{E(cv["focusHeader"])}</th></tr></thead><tbody>{crows}</tbody></table></div>
      </section>
      <div class="side">
        <section class="card" aria-labelledby="{t}-exp-h"><h2 id="{t}-exp-h"{K(*P, "expect", "heading")}>{E(ex["heading"])}</h2>{expect}</section>
        <section class="card" aria-labelledby="{t}-cert-h"><h2 id="{t}-cert-h"{K(*P, "certification", "heading")}>{E(ce["heading"])}</h2><p{K(*P, "certification", "body")}>{E(ce["body"])}</p></section>
      </div>
    </div>
  </div>
</section>'''

header, sheet, footer, quick = chrome('https://www.cnessworks.com/analyze')
copy = {  # strings used only by script, verbatim from the inventory
  'scorer': C['scorer'], 'validation': C['validation'], 'finishFirst': C['finishFirst'], 'emailError': C['emailError'],
  'tracks': {t: {'pillars': [p['name'] for p in C['tracks'][t]['pillars']], 'busy': C['tracks'][t]['form']['busy']} for t in TRACKS},
}
preview = '''<dialog class="pvd" id="pvd" aria-labelledby="pvd-h" data-preview>
  <div class="in"><h2 id="pvd-h">Preview only</h2>
  <p>This page is a design preview and is not connected to the CNESS service. Nothing was sent and no email will arrive.</p>
  <p>On cnessworks.com, this button sends your ratings and details to CNESS, and the score is emailed within 24 hours.</p>
  <div class="acts"><button type="button" class="btn ghost" data-close>Back to the form</button><button type="button" class="btn" data-show>See the confirmation screen</button></div></div>
</dialog>'''
page = f'''<title>CNESS Analyze</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="{E(C['tracks']['organization']['heroSubtitle'])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Onest:wght@300..700&display=swap">
<style>
{rd('src/advantage/style.css')}
{rd('src/analyze/style.css')}</style>

<a class="skip" href="#main">Skip to content</a>
<div class="sky" aria-hidden="true"></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="terrain" viewBox="0 0 1600 400">{terrain()}</symbol></svg>
{header}
{sheet}
<p class="sr" id="an-status" aria-live="polite"></p>

<main id="main">
  <div class="wrap an-tabs">{tabs()}</div>
{chr(10).join(panel(t, i) for i, t in enumerate(TRACKS))}
</main>
{preview}
{footer}
{quick}

<script type="application/json" id="an-copy">{json.dumps(copy, ensure_ascii=False).replace("</", "<\\/")}</script>
<script>
{rd('src/analyze/app.js')}</script>
'''
(ROOT / 'src/analyze.html').write_text(page, encoding='utf-8')
print(f'wrote src/analyze.html ({len(page) // 1024} KB)')
