#!/usr/bin/env python3
"""Builds src/certification.html: the Certification section (three routed pages) on the shared CNESSWORKS system.

Content (locked, captured from the live pages; never edited by hand):
  content/mother-of-certification.json, content/cness-certification.json, content/product-certification.json
  Site chrome (header, footer, quick actions) comes from content/cness-advantage.json.
Presentation: src/advantage/style.css (shared system) + src/certification/style.css
Motion/routing: src/certification/motion.js (graphics are inline SVG/CSS, one set per page; no WebGL)

Every approved string is copied verbatim from the JSON and tagged data-k="<page>:<json path>", so
tools/verify-certification.js can resolve each element back to its inventory entry.
Links to the three pages route inside the preview (#<route>); every such link keeps its production URL
in data-prod-href. All other links keep their live destinations.
"""
import json, html, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
rd = lambda p: (ROOT / p).read_text(encoding='utf-8')
ld = lambda p: json.loads(rd(p))
MOC, ORG, PRD = ld('content/mother-of-certification.json'), ld('content/cness-certification.json'), ld('content/product-certification.json')
SITE = ld('content/cness-advantage.json')
E = lambda s: html.escape(s, quote=True)
B = 'https://www.cnessworks.com'
ROUTES = {B + '/mother-of-certification': 'mother-of-certification', B + '/cness-certification': 'cness-certification', B + '/product-certification': 'product-certification'}

def K(page, *path): return f' data-k="{page}:{".".join(str(p) for p in path)}"'
def href(url):
    """Production URL -> preview destination. The three certification pages route in the preview."""
    if url in ROUTES: return f'href="#{ROUTES[url]}" data-route="{ROUTES[url]}" data-prod-href="{E(url)}"'
    return f'href="{E(url)}" data-prod-href="{E(url)}" target="_blank" rel="noopener"'
ARR = '<span class="arr" aria-hidden="true">→</span>'
def cta(page, path, l, cls='btn'):
    return f'<a class="{cls}" {href(l["url"])}{K(page, *path)}>{E(l["text"])} {ARR}</a>'
def words(s):  # hero headline words (spaces kept as text)
    return ' '.join(f'<span class="w" style="--i:{i}">{E(w)}</span>' for i, w in enumerate(s.split(' ')))

def ic(d): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{d}</svg>'
I = {
  'search': ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  'doc': ic('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 12h6M9.5 15.5h6"/>'),
  'prev': ic('<path d="M15 5l-7 7 7 7"/>'), 'next': ic('<path d="M9 5l7 7-7 7"/>'), 'close': ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  'analyze': ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/><path d="M7.5 12l2-2.5 1.8 1.5 2.2-3"/>'),
  'grid': ic('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  'up': ic('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  'chev': '<svg class="chev" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
}
SOCIAL = {
  'Facebook': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg>',
  'YouTube': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
  'Instagram': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
  'LinkedIn': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.5 9h3v11h-3zM6 3.8A1.8 1.8 0 1 1 6 7.4a1.8 1.8 0 0 1 0-3.6zM10 9h2.9v1.5c.4-.8 1.4-1.7 3-1.7 3.1 0 3.6 2 3.6 4.7V20h-3v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20H10z"/></svg>',
}
SEC = []  # (page, id, label, scene index) for the per-page section dots

# ---------- Page graphics (decorative, aria-hidden; each page has its own set) ----------
import math
MAP = json.loads(rd('tools/data/worldmap.json'))
def pt(r, deg): a = math.radians(deg); return (round(r * math.sin(a), 2), round(-r * math.cos(a), 2))   # 0deg = up, clockwise

def art_canopy():
    """Mother of Certification hero: one canopy over seven seals; light falls onto it and stops there."""
    ends = [20 + k * 45 for k in range(9)]
    ribs = ''.join(f'<path pathLength="1" style="--i:{k}" d="M200 60Q{200 + (x - 200) * .55:.0f} {64 + abs(x - 200) * .05:.0f} {x} 150"/>' for k, x in enumerate(ends))
    scal = 'M20 150' + ''.join('q22.5 17 45 0' for _ in range(8))
    seals = ''.join(f'<i style="--x:{12 + k * 12.67:.2f}%;--y:{70 - math.sin(k / 6 * math.pi) * 9:.1f}%;--i:{k}"></i>' for k in range(7))
    # falling light: streaks end on the canopy surface (y of the dome at that x, as % of the 400x340 box)
    def dome_y(x): t = (x - 20) / 360; return ((1 - t) ** 2 * 150 + 2 * (1 - t) * t * -30 + t * t * 150)
    motes = ''.join(f'<b style="--x:{x / 4:.1f}%;--y:{dome_y(x) / 3.4:.1f}%;--d:{d}s;--t:{t}s"></b>' for x, d, t in [(60, 0, 3.1), (104, 1.3, 2.7), (148, .6, 3.4), (186, 2.1, 2.9), (226, .2, 3.2), (262, 1.7, 2.8), (300, .9, 3.5), (342, 2.4, 3.0), (128, 2.9, 3.3), (276, 3.4, 2.6)])
    return f'''<div class="art canopy" data-par aria-hidden="true">
      <div class="motes">{motes}</div>
      <div class="beam"></div>
      <svg class="dome" viewBox="0 0 400 340"><defs><linearGradient id="cg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="220"><stop offset="0" stop-color="#FFE8A3"/><stop offset="1" stop-color="#FFC81A"/></linearGradient></defs>
        <path class="shell" d="M20 150Q200 -30 380 150{'q-22.5 17 -45 0' * 8}Z"/>
        <g class="ribs">{ribs}</g><path class="edge" pathLength="1" d="{scal}"/><path class="stem" pathLength="1" d="M200 60V292q0 22-20 22q-15 0-17-15"/></svg>
      <div class="seals">{seals}</div>
    </div>'''

def art_map():
    """Mother of Certification industry table: dotted world map; the region chosen in the filter lights up."""
    order = ['rest', 'India', 'Canada', 'USA', 'Europe', 'Australia', 'Japan']
    paths = ''.join(f'<path class="r" data-r="{r}" d="{MAP["paths"][r]}"/>' for r in order)
    pins = ''.join(f'<i data-r="{r}" style="--x:{MAP["c"][r][0] / MAP["w"] * 100:.2f}%;--y:{MAP["c"][r][1] / (MAP["h"] - 1) * 100:.2f}%"></i>' for r in order[1:])
    return f'<div class="art wmap" data-region="All" aria-hidden="true"><svg viewBox="-1 -1 {MAP["w"] + 1} {MAP["h"] + 1}" preserveAspectRatio="xMidYMid meet">{paths}</svg>{pins}</div>'

def art_join(labels):
    """Mother of Certification compare: two frameworks move inside one larger ring."""
    return f'<div class="art join" aria-hidden="true"><span class="big"></span><span class="a">{E(labels[0])}</span><span class="b">{E(labels[1])}</span></div>'

def art_temple():
    """Organization hero: six columns of light, one per pillar."""
    hs = [64, 82, 96, 92, 78, 60]
    cols = ''.join(f'<li style="--h:{h}%;--i:{k}"><i></i></li>' for k, h in enumerate(hs))
    return f'<div class="art temple" data-par aria-hidden="true"><span class="arc"></span><ul>{cols}</ul><span class="base"></span></div>'

def art_wheel(ns):
    """Organization evaluate: six segments of one hexagon; the pillar in focus turns to the top."""
    R, gap = 100, 3.2; segs = []
    for s in range(6):
        a0, a1 = s * 60, s * 60 + 60; mid = a0 + 30
        ox, oy = pt(gap, mid); A, B = pt(R, a0), pt(R, a1)
        segs.append(f'<path class="seg" data-i="{s}" d="M{ox} {oy}L{A[0] + ox:.2f} {A[1] + oy:.2f}L{B[0] + ox:.2f} {B[1] + oy:.2f}Z"/>')
    inner = ''.join(f'<path d="M{pt(R * f, 0)[0]} {pt(R * f, 0)[1]}' + ''.join(f'L{pt(R * f, k * 60)[0]} {pt(R * f, k * 60)[1]}' for k in range(1, 6)) + 'Z"/>' for f in (.38, .68))
    nums = ''.join(f'<b data-i="{s}">{E(n)}</b>' for s, n in enumerate(ns))
    return f'<div class="art wheel" aria-hidden="true"><span class="sweep"></span><div class="rot"><svg viewBox="-112 -112 224 224">{"".join(segs)}<g class="lat">{inner}</g></svg></div><span class="ctr">{nums}</span></div>'

def art_prod():
    """Product hero: a product in a slow turn, inside one ring of 108 places."""
    dots = ''.join(f'M{pt(92, k * 360 / 108)[0]} {pt(92, k * 360 / 108)[1]}h0' for k in range(108))
    check = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    faces = ''.join(f'<i class="fc {c}">{inner}</i>' for c, inner in [('f1', check), ('f2', '<img src="assets/cness-mark.svg" alt="">'), ('f3', ''), ('f4', ''), ('f5', check), ('f6', '')])
    return f'''<div class="art prod" data-par aria-hidden="true">
      <div class="orb"><svg viewBox="-100 -100 200 200"><path d="{dots}"/></svg></div>
      <div class="orb comet"><i></i></div>
      <div class="scene"><div class="cube">{faces}</div></div>
      <span class="pool"></span>
    </div>'''

def art_invite(mark):
    """Product 108: an invitation that opens as it arrives."""
    return f'<div class="art invite" aria-hidden="true"><div class="env"><span class="back"></span><span class="card"><b>{E(mark)}</b><i></i><i></i><i></i></span><svg class="front" viewBox="0 0 100 60" preserveAspectRatio="none"><defs><linearGradient id="ivg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2488"/><stop offset="1" stop-color="#19125A"/></linearGradient></defs><path d="M0 4Q0 0 3 1.5L50 34L97 1.5Q100 0 100 4V56Q100 60 96 60H4Q0 60 0 56Z" fill="url(#ivg)" stroke="rgba(255,200,26,.45)" stroke-width=".4" vector-effect="non-scaling-stroke"/></svg><span class="flap"></span><span class="seal">✦</span></div></div>'

def art_bloom(ns):
    """Product evaluate: seven petals, one per pillar."""
    petals = []
    for k in range(7):
        a = k * 360 / 7; L = pt(46, a - 22); Rr = pt(46, a + 22); V = pt(100, a)
        petals.append(f'<path class="pet" data-i="{k}" style="--i:{k}" d="M0 0Q{L[0]} {L[1]} {V[0]} {V[1]}Q{Rr[0]} {Rr[1]} 0 0Z"/>')
    nums = ''.join(f'<b data-i="{k}" style="--x:{50 + pt(30, k * 360 / 7)[0]:.1f}%;--y:{50 + pt(30, k * 360 / 7)[1]:.1f}%">{E(n)}</b>' for k, n in enumerate(ns))
    return f'<div class="art bloom" aria-hidden="true"><svg viewBox="-104 -104 208 208"><circle class="halo" r="100"/>{"".join(petals)}<circle class="core" r="9"/></svg>{nums}</div>'

def sec(page, sid, label, scene, inner, cls='sec', side=''):
    SEC.append((page, sid, label))
    return f'<section class="{cls}" id="{sid}" data-scene="{scene}"{f" data-side={side}" if side else ""} aria-label="{E(label)}">\n{inner}\n</section>'

# ======================= A. Mother of Certification =======================
def mother():
    P, M = 'moc', MOC; h = M['hero']; ind = M['industry']; o = []
    o.append(f'''<section class="pg-hero moc-hero" id="moc-top" data-scene="0" aria-labelledby="h-moc">
  <div class="wrap stage"><div class="txt">
    <div class="crumbs"><span class="tag"{K(P,'hero','eyebrow')}>{E(h['eyebrow'])}</span><span class="chip"{K(P,'hero','label')}>{E(h['label'])}</span></div>
    <h1 id="h-moc" class="h-lg" tabindex="-1"{K(P,'hero','h1')}>{words(h['h1'])}</h1>
    <p class="lede"{K(P,'hero','p',0)}>{E(h['p'][0])}</p>
    <p class="note lede-pearl"{K(P,'hero','p',1)}>{E(h['p'][1])}</p>
  </div>{art_canopy()}</div>
</section>''')
    SEC.append((P, 'moc-top', h['label']))
    rows = []
    for i, r in enumerate(ind['rows']):
        cells = f'<th scope="row"{K(P,"industry","rows",i,0)}>{E(r[0])}</th>' + ''.join(f'<td{K(P,"industry","rows",i,j)}>{E(c)}</td>' for j, c in enumerate(r[1:-1], 1)) + f'<td class="lvl" data-l="{E(r[5])}"><span{K(P,"industry","rows",i,5)}>{E(r[5])}</span></td>'
        rows.append(f'<tr data-r="{E(r[0])}" data-q="{E(" ".join(r[1:]).lower())}">{cells}</tr>')
    filt = ''.join(f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}" data-f="{E(f)}"{K(P,"industry","filters",i)}>{E(f)}</button>' for i, f in enumerate(ind['filters']))
    o.append(sec(P, 'moc-industry', ind['label'], 1, f'''  <div class="wrap">
    <div class="moc-ind">
      <figure class="fig" data-in><img src="{E(ind['image']['src'])}" width="960" height="639" alt="{E(ind['image']['alt'])}" loading="lazy" decoding="async"></figure>
      <div class="txt" style="display:grid;gap:1.1rem" data-in>
        <span class="k2"{K(P,'industry','label')}>{E(ind['label'])}</span>
        <h2 class="h-md"{K(P,'industry','h2')}>{E(ind['h2'])}</h2>
        <p class="lede"{K(P,'industry','p')}>{E(ind['p'])}</p>
        <div class="acts">{cta(P,('industry','ctas',0),ind['ctas'][0])}{cta(P,('industry','ctas',1),ind['ctas'][1],'btn ghost')}</div>
      </div>
    </div>
    <div class="tbl-wrap" id="moc-table">
      {art_map()}
      <div class="tools">
        <label class="search"><span class="sr">{E(ind['search']['placeholder'])}</span>{I['search']}<input type="search" id="moc-q" placeholder="{E(ind['search']['placeholder'])}" autocomplete="off" aria-controls="moc-tbl"></label>
        <div class="seg" role="group" aria-label="{E(ind['columns'][0])}">{filt}</div>
      </div>
      <div class="tbl" id="moc-tbl" role="region" aria-label="{E(ind['h2'])}" tabindex="0">
        <table><thead><tr>{''.join(f'<th scope="col"{K(P,"industry","columns",j)}>{E(c)}</th>' for j, c in enumerate(ind['columns']))}</tr></thead>
        <tbody>{''.join(rows)}<tr class="empty" hidden><td colspan="6"{K(P,'industry','empty')}>{E(ind['empty'])}</td></tr></tbody></table>
      </div>
      <p class="sr" id="moc-count" aria-live="polite"></p>
      <div class="tbl-foot"><button class="btn ghost" type="button" id="moc-more" aria-controls="moc-tbl" aria-expanded="false" data-more="{E(ind['more'])}" data-less="{E(ind['less'])}"{K(P,'industry','more')}>{E(ind['more'])}</button></div>
    </div>
  </div>''', side='r'))
    cmp = ''.join(f'''<article class="glass pad cmp" data-in data-big="{"9001" if i == 0 else "B"}">
        <span class="k2"{K(P,'compare',i,'label')}>{E(c['label'])}</span><h3{K(P,'compare',i,'h3')}>{E(c['h3'])}</h3>
        <p{K(P,'compare',i,'p',0)}>{E(c['p'][0])}</p><p{K(P,'compare',i,'p',1)}>{E(c['p'][1])}</p></article>''' for i, c in enumerate(M['compare']))
    o.append(sec(P, 'moc-compare', M['compare'][0]['label'], 2, f'  <div class="wrap">{art_join(("9001", "B"))}<div class="duo">{cmp}</div></div>'))
    cards = ''.join(f'''<a class="glass pad lcard" {href(c['url'])}{K(P,'cards',i,'url')}><h3{K(P,'cards',i,'h3')}>{E(c['h3'])}</h3><p{K(P,'cards',i,'p')}>{E(c['p'])}</p><span class="go"><span{K(P,'cards',i,'label')}>{E(c['label'])}</span> {ARR}</span></a>''' for i, c in enumerate(M['cards']))
    o.append(sec(P, 'moc-cards', M['cards'][0]['h3'], 3, f'  <div class="wrap"><div class="duo" data-in>{cards}</div></div>'))
    c = M['closing']
    o.append(sec(P, 'moc-close', c['label'], 4, f'''  <div class="sunrise"><div class="in">
    <img class="mk" src="assets/cness-mark.svg" width="64" height="64" alt="" decoding="async">
    <span class="k2"{K(P,'closing','label')}>{E(c['label'])}</span>
    <h2{K(P,'closing','h2')}>{E(c['h2'])}</h2>
    <p{K(P,'closing','p',0)}>{E(c['p'][0])}</p><p class="motto"{K(P,'closing','p',1)}>{E(c['p'][1])}</p>
    <div class="acts">{cta(P,('closing','cta'),c['cta'],'btn dark')}</div>
  </div></div>''', cls='dawn final'))
    return '\n'.join(o)

# ======================= B. Organization Certification =======================
def org():
    P, O = 'org', ORG; h = O['hero']; o = []
    titles = [p['title'].replace('-', '–') for p in O['evaluate']['pillars']]
    def ev_index(r):  # hero chip -> the matching pillar in the Evaluate section (opens its details)
        lab = (r[0] + ' ' + r[1]).replace('-', '–'); return next(k for k, t in enumerate(titles) if t.startswith(lab.split(' &')[0]) or t == lab)
    ring = ''.join(f'<li><button type="button" class="chip6" data-col="{i}" data-open-pillar="{ev_index(r)}" aria-haspopup="dialog"><span{K(P,"hero","ring",i,0)}>{E(r[0])}</span> <span{K(P,"hero","ring",i,1)}>{E(r[1])}</span></button></li>' for i, r in enumerate(h['ring']))
    stats = ''.join(f'''<div class="stat"><span class="v"{K(P,'hero','stats',i,'value')}>{E(s['value'])}</span><span class="t">{' '.join(f'<span{K(P,"hero","stats",i,"title",j)}>{E(t)}</span>' for j, t in enumerate(s['title']))}</span><p class="d"{K(P,'hero','stats',i,'desc')}>{E(s['desc'])}</p><p class="src"><b>Source</b>: <span{K(P,'hero','stats',i,'source')}>{E(s['source'])}</span></p></div>''' for i, s in enumerate(h['stats']))
    o.append(f'''<section class="pg-hero org-hero" id="org-top" data-scene="0" aria-labelledby="h-org">
  <div class="wrap stage">
    <div class="txt">
      <h1 id="h-org" class="h-lg" tabindex="-1"{K(P,'hero','h1')}>{words(h['h1'])}</h1>
      <p class="lede"{K(P,'hero','p')}>{E(h['p'])}</p>
      <div class="acts">{cta(P,('hero','cta'),h['cta'])}<a class="glimpse" href="#org-benefits"><i aria-hidden="true"></i><span{K(P,'hero','glimpse')}>{E(h['glimpse'])}</span></a></div>
    </div>
    <div class="ringbox">{art_temple()}<ul class="ring" aria-label="{E(O['evaluate']['label'])}">{ring}</ul></div>
  </div>
  <div class="wrap" style="margin-top:clamp(1.5rem,4vh,2.5rem)"><div class="stats" data-in>{stats}</div></div>
</section>''')
    SEC.append((P, 'org-top', h['h1']))
    cm = O['community']
    logos = ''.join(f'<li><a {href(l["url"])}{K(P,"community","logos",i,"url")} aria-label="{E(l["name"])}"><img src="{E(l["img"])}" alt="" loading="lazy" decoding="async"></a></li>' for i, l in enumerate(cm['logos']))
    o.append(sec(P, 'org-community', cm['h2'], 1, f'''  <div class="wrap"><div class="glass pad" data-in>
    <div class="comm-h"><h2{K(P,'community','h2')}>{E(cm['h2'])}</h2><a class="btn ghost sm" {href(cm['explore']['url'])}{K(P,'community','explore')}>{E(cm['explore']['text'])} {ARR}</a></div>
    <ul class="logos">{logos}</ul></div></div>'''))
    w = O['why']; mx = 100
    bars = ''.join(f'<div class="cbar{" un" if i else ""}" style="--h:{int(b["value"].rstrip("%"))}"><span class="lab"{K(P,"why","chart",i,"label")}>{E(b["label"])}</span><span class="val"{K(P,"why","chart",i,"value")}>{E(b["value"])}</span><span class="col" aria-hidden="true"></span></div>' for i, b in enumerate(w['chart']))
    o.append(sec(P, 'org-why', w['kicker'], 2, f'''  <div class="wrap why">
    <div class="txt" style="display:grid;gap:1.1rem" data-in><h3 class="kick"{K(P,'why','kicker')}>{E(w['kicker'])}</h3>
      <p class="hd"><span{K(P,'why','heading',0)}>{E(w['heading'][0])}</span> <span{K(P,'why','heading',1)}>{E(w['heading'][1])}</span></p>
      <p class="lede"{K(P,'why','p')}>{E(w['p'])}</p></div>
    <figure class="glass bars" data-bars data-in style="margin:0">{bars}</figure>
  </div>''', side='l'))
    ev = O['evaluate']
    pills = []
    for i, p in enumerate(ev['pillars']):
        d = p['dialog']
        pills.append(f'''<li><button class="pbtn" type="button" data-open="pd-{i}" data-pillar="{i}" aria-haspopup="dialog"><span class="n"{K(P,'evaluate','pillars',i,'n')}>{E(p['n'])}</span><span class="t"{K(P,'evaluate','pillars',i,'title')}>{E(p['title'])}</span><span class="s"{K(P,'evaluate','pillars',i,'subtitle')}>{E(p['subtitle'])}</span><span class="more" aria-hidden="true">{ARR}</span></button>
<dialog class="pd" id="pd-{i}" aria-labelledby="pd-{i}-h"><div class="in">
  <header><span class="k2">{E(p['n'])} / 06</span><h2 id="pd-{i}-h"{K(P,'evaluate','pillars',i,'dialog','title')}>{E(d['title'])}</h2><p class="sub"{K(P,'evaluate','pillars',i,'dialog','subtitle')}>{E(d['subtitle'])}</p></header>
  <div class="body" tabindex="0"><p{K(P,'evaluate','pillars',i,'dialog','description')}>{E(d['description'])}</p><ol>{''.join(f'<li{K(P,"evaluate","pillars",i,"dialog","points",j)}>{E(x)}</li>' for j, x in enumerate(d['points']))}</ol></div>
  <footer><span class="cnt">{E(p['n'])} / 06</span><button class="icb" type="button" data-step="-1" aria-label="{E(ev['dialogControls']['prev'])}">{I['prev']}</button><button class="icb" type="button" data-step="1" aria-label="{E(ev['dialogControls']['next'])}">{I['next']}</button><button class="btn ghost sm" type="button" data-close>{E(ev['dialogControls']['close'])}</button></footer>
</div></dialog></li>''')
    o.append(sec(P, 'org-evaluate', ev['label'], 3, f'''  <div class="wrap">
    <div class="stage"><div class="txt" data-in><h2 class="k2"{K(P,'evaluate','h2')}>{E(ev['h2'])}</h2><h3 class="h-md"{K(P,'evaluate','h3')}>{E(ev['h3'])}</h3><p class="tag"{K(P,'evaluate','label')}>{E(ev['label'])}</p></div>{art_wheel([p['n'] for p in ev['pillars']])}</div>
    <ul class="pill6" data-in>{''.join(pills)}</ul>
  </div>''', side='r'))
    bn = O['benefits']
    bst = ''.join(f'''<div class="stat"><span class="v"{K(P,'benefits','stats',i,'value')}>{E(s['value'])}</span><span class="t"{K(P,'benefits','stats',i,'title')}>{E(s['title'])}</span><p class="d"{K(P,'benefits','stats',i,'desc')}>{E(s['desc'])}</p><p class="src"><b>Source</b>: <span{K(P,'benefits','stats',i,'source')}>{E(s['source'])}</span></p></div>''' for i, s in enumerate(bn['stats']))
    b4 = ''.join(f'<li><span class="n"{K(P,"benefits","items",i,"n")}>{E(b["n"])}</span><span class="t"{K(P,"benefits","items",i,"title")}>{E(b["title"])}</span><p class="d"{K(P,"benefits","items",i,"desc")}>{E(b["desc"])}</p></li>' for i, b in enumerate(bn['items']))
    o.append(sec(P, 'org-benefits', bn['h2'], 4, f'''  <div class="wrap">
    <div class="ben-head" data-in><div style="display:grid;gap:1rem"><h2 class="k2"{K(P,'benefits','h2')}>{E(bn['h2'])}</h2><p class="hd">{' '.join(f'<span{K(P,"benefits","heading",j)}>{E(t)}</span>' for j, t in enumerate(bn['heading']))}</p></div><p class="lede"{K(P,'benefits','p')}>{E(bn['p'])}</p></div>
    <div class="stats" style="margin-top:1.6rem" data-in>{bst}</div>
    <p class="tag" style="margin-top:2.2rem"{K(P,'benefits','label')}>{E(bn['label'])}</p>
    <ul class="ben4" data-in>{b4}</ul>
  </div>'''))
    hw = O['how']
    st = ''.join(f'<li data-stepi="{i}"><span class="n"{K(P,"how","steps",i,"n")}>{E(s["n"])}</span><span class="t"{K(P,"how","steps",i,"title")}>{E(s["title"])}</span><p class="d"{K(P,"how","steps",i,"desc")}>{E(s["desc"])}</p></li>' for i, s in enumerate(hw['steps']))
    o.append(sec(P, 'org-how', hw['h2'], 5, f'''  <div class="wrap">
    <div class="stage c"><div class="txt" data-in><h2 class="k2"{K(P,'how','h2')}>{E(hw['h2'])}</h2><h3 class="h-md"{K(P,'how','h3')}>{E(hw['h3'])}</h3></div></div>
    <ol class="steps5" data-fill>{st}<li class="run" aria-hidden="true"></li></ol>
    <div class="acts" style="margin-top:2rem">{cta(P,('how','ctas',0),hw['ctas'][0],'btn desk-only')}{cta(P,('how','ctas',1),hw['ctas'][1],'btn ghost')}</div>
  </div>''', side='l'))
    sp = O['spotlight']
    slides = ''.join(f'''<figure class="slide" id="sl-{i}" role="group" aria-roledescription="slide" aria-label="{i + 1} / {len(sp['items'])}" aria-hidden="{'false' if i == 0 else 'true'}"><div class="ph"><img src="{E(t['img'])}" alt="{E(t['name'])}" loading="lazy" decoding="async"></div><div><figcaption><b{K(P,'spotlight','items',i,'name')}>{E(t['name'])}</b><span{K(P,'spotlight','items',i,'role')}>{E(t['role'])}</span></figcaption><blockquote{K(P,'spotlight','items',i,'quote')}>{E(t['quote'])}</blockquote></div></figure>''' for i, t in enumerate(sp['items']))
    o.append(sec(P, 'org-spotlight', sp['h2'][0], 6, f'''  <div class="wrap spot">
    <div class="txt" style="display:grid;gap:1.1rem" data-in><h2 class="h-md"><span{K(P,'spotlight','h2',0)}>{E(sp['h2'][0])}</span> <span class="g"{K(P,'spotlight','h2',1)}>{E(sp['h2'][1])}</span></h2><p class="lede"{K(P,'spotlight','p')}>{E(sp['p'])}</p></div>
    <div class="glass pad" data-in><div class="car" aria-roledescription="carousel" aria-label="{E(sp['h2'][0])} {E(sp['h2'][1])}">{slides}</div>
      <div class="car-ctl"><span class="dots2" aria-hidden="true"><i class="on"></i><i></i></span><button class="icb" type="button" data-car="-1" aria-label="{E(sp['controls']['prev'])}">{I['prev']}</button><button class="icb" type="button" data-car="1" aria-label="{E(sp['controls']['next'])}">{I['next']}</button></div></div>
  </div>'''))
    lv = O['levels']
    def lcard(i, x, cls=''):
        return f'''<article class="lvc{cls}" data-level="{i}"><img class="em" src="assets/emblem-{x['emblem']}.svg" width="64" height="64" alt="" decoding="async">
      <span class="tier"{K(P,'levels','items',i,'tier')}>{E(x['tier'])}</span><h3{K(P,'levels','items',i,'name')}>{E(x['name'])}</h3><p class="tg"{K(P,'levels','items',i,'tagline')}>{E(x['tagline'])}</p>
      <div style="display:grid;gap:.9rem;align-content:start"><h4{K(P,'levels','items',i,'showsLabel')}>{E(x['showsLabel'])}</h4><ul>{''.join(f'<li{K(P,"levels","items",i,"shows",j)}>{E(s)}</li>' for j, s in enumerate(x['shows']))}</ul>
      <h4{K(P,'levels','items',i,'advLabel')}>{E(x['advLabel'])}</h4><ul class="adv">{''.join(f'<li{K(P,"levels","items",i,"advantages",j)}>{E(s)}</li>' for j, s in enumerate(x['advantages']))}</ul></div>
      <p class="prog"{K(P,'levels','items',i,'progress')}><b>{E(x['progressEmphasis'])}</b>{E(x['progress'][len(x['progressEmphasis']):])}</p></article>'''
    o.append(sec(P, 'org-levels', lv['h2'], 7, f'''  <div class="wrap">
    <div class="stage c"><div class="txt" data-in><h2 class="h-lg"{K(P,'levels','h2')}>{E(lv['h2'])}</h2><p class="lede"{K(P,'levels','p')}>{E(lv['p'])}</p></div></div>
    <div class="lv5">{''.join(lcard(i, x) for i, x in enumerate(lv['items'][:3]))}</div>
    <div class="layers">{''.join(lcard(i, x, ' layer') for i, x in enumerate(lv['items'][3:], 3))}</div>
  </div>'''))
    fq = O['faq']
    tabs = ''.join(f'<button type="button" role="tab" id="ft-{i}" aria-controls="fp-{i}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}"{K(P,"faq","tabs",i,"name")}>{E(t["name"])}</button>' for i, t in enumerate(fq['tabs']))
    panels = ''.join(f'''<div class="faq-p" role="tabpanel" id="fp-{i}" aria-labelledby="ft-{i}"{'' if i == 0 else ' hidden'}>{''.join(f'<details><summary><span{K(P,"faq","tabs",i,"items",j,"q")}>{E(x["q"])}</span><i aria-hidden="true"></i></summary><p class="a"{K(P,"faq","tabs",i,"items",j,"a")}>{E(x["a"])}</p></details>' for j, x in enumerate(t['items']))}</div>''' for i, t in enumerate(fq['tabs']))
    o.append(sec(P, 'org-faq', fq['h3'], 8, f'''  <div class="wrap"><div style="max-width:60rem">
    <h3 class="h-md"{K(P,'faq','h3')}>{E(fq['h3'])}</h3><p class="lede" style="margin-top:1rem"{K(P,'faq','p')}>{E(fq['p'])}</p>
    <div class="faq-t" role="tablist" aria-label="{E(fq['h3'])}">{tabs}</div>{panels}
  </div></div>''', side='r'))
    bg = O['begin']
    o.append(sec(P, 'org-begin', bg['h3'], 9, f'''  <div class="sunrise"><div class="in">
    <img class="mk" src="assets/cness-mark.svg" width="64" height="64" alt="" decoding="async">
    <h3 class="h-lg"{K(P,'begin','h3')}>{E(bg['h3'])}</h3><p{K(P,'begin','p')}>{E(bg['p'])}</p>
    <div class="acts">{cta(P,('begin','cta'),bg['cta'],'btn dark')}</div>
  </div></div>''', cls='dawn final'))
    return '\n'.join(o)

def chart(P, i, rows):
    """One small chart per statistic. Labels and values are tagged copy; the figure itself is hidden from
    assistive technology because the slide text states the same figures."""
    k = lambda r, f: K(P, 'market', 'items', i, 'chart', r, f)
    num = lambda v: float(v.rstrip('%'))
    if i == 0:   # paired meters on a 0-100 scale: share of the market vs share of the growth
        body = ''.join(f'<div class="mr{" hi" if r == 1 else ""}" style="--v:{num(x["value"]) / 100:.3f}"><b class="mv"{k(r, "value")}>{E(x["value"])}</b><span class="ml"{k(r, "label")}>{E(x["label"])}</span><span class="mt"><i></i></span></div>' for r, x in enumerate(rows))
        return f'<div class="ch ch-meters">{body}<span class="axis"><i>0</i><i>50%</i><i>100%</i></span></div>'
    if i == 1:   # columns: five-year compound annual growth
        top = 12
        body = ''.join(f'<div class="cc{" hi" if r == 0 else ""}" style="--v:{num(x["value"]) / top:.3f}"><span class="cb"><i></i><b class="mv"{k(r, "value")}>{E(x["value"])}</b></span><span class="ml"{k(r, "label")}>{E(x["label"])}</span></div>' for r, x in enumerate(rows))
        return f'<div class="ch ch-cols">{body}</div>'
    if i == 2:   # slope from a shared start: growth over five years with and without ESG-related claims
        y = lambda v: 56 - v / 32 * 50
        lines = ''.join(f'<line class="{"hi" if r == 0 else "lo"}" x1="0" y1="56" x2="100" y2="{y(num(x["value"])):.2f}" vector-effect="non-scaling-stroke"/>' for r, x in enumerate(rows))
        ends = ''.join(f'<span class="se{" hi" if r == 0 else ""}" style="--y:{y(num(x["value"])) / 60 * 100:.2f}%"><b class="mv"{k(r, "value")}>{E(x["value"])}</b><span class="ml"{k(r, "label")}>{E(x["label"])}</span></span>' for r, x in enumerate(rows))
        return f'<div class="ch ch-slope"><div class="sl"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><line class="base" x1="0" y1="56" x2="100" y2="56" vector-effect="non-scaling-stroke"/><g class="rise">{lines}</g></svg>{ends}</div></div>'
    x = rows[0]; n = round(num(x['value']))
    cls = 'ch-dots' if i == 3 else 'ch-tiles'
    cells = ''.join(f'<i{" class=on" if c < n else ""} style="--d:{c % 10 + c // 10}"></i>' for c in range(100))
    return f'<div class="ch {cls}"><div class="grid100">{cells}</div><p class="gl"><b class="mv"{k(0, "value")}>{E(x["value"])}</b> <span class="ml"{k(0, "label")}>{E(x["label"])}</span></p></div>'

def market(P, m):
    """Product: market research as a deck of statistics to swipe, drag, scroll sideways or step through."""
    n = len(m['items'])
    tabs = ''.join(f'<button type="button" role="tab" id="mk-t{i}" aria-controls="mk-s{i}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}"><span class="tn" aria-hidden="true">{i + 1:02d}</span><span{K(P, "market", "tabs", i)}>{E(t)}</span></button>' for i, t in enumerate(m['tabs']))
    slides = []
    for i, x in enumerate(m['items']):
        src = x['source']
        slides.append(f'''<div class="mslide{" on" if i == 0 else ""}" id="mk-s{i}" role="tabpanel" aria-roledescription="slide" aria-labelledby="mk-t{i}"{"" if i == 0 else " inert"}>
        <div class="st"><p class="big"{K(P, 'market', 'items', i, 'value')}>{E(x['value'])}</p><p class="sti"{K(P, 'market', 'items', i, 'title')}>{E(x['title'])}</p><p class="std"{K(P, 'market', 'items', i, 'detail')}>{E(x['detail'])}</p></div>
        <div class="sv" aria-hidden="true">{chart(P, i, x['chart'])}</div>
        <p class="src"><span class="srl">Source</span> <a {href(src['url'])}{K(P, 'market', 'items', i, 'source')}>{E(src['text'])}</a></p>
      </div>''')
    return sec(P, 'prd-market', m['label'], 5, f'''  <div class="wrap mkt">
    <div class="mkt-h" data-in><span class="k2"{K(P, 'market', 'label')}>{E(m['label'])}</span><h2 class="h-md"{K(P, 'market', 'h2')}>{E(m['h2'])}</h2><p class="lede"{K(P, 'market', 'p')}>{E(m['p'])}</p></div>
    <div class="deck" data-in data-deck role="region" aria-roledescription="carousel" aria-label="{E(m['h2'])}">
      <div class="deck-bar">
        <div class="deck-tabs" role="tablist" aria-label="{E(m['label'])}">{tabs}</div>
        <div class="deck-arrows"><button type="button" class="da" data-step="-1" aria-label="Previous statistic" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="dc" aria-hidden="true"><b>01</b> / {n:02d}</span><button type="button" class="da" data-step="1" aria-label="Next statistic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      </div>
      <div class="deck-view"><div class="deck-track" style="--n:{n}">
      {"".join(slides)}
      </div></div>
      <div class="deck-prog" aria-hidden="true"><i style="--p:{1 / n:.4f}"></i></div>
      <p class="sr" aria-live="polite" data-deck-status></p>
    </div>
    <p class="note mkt-note"{K(P, 'market', 'note')}>{E(m['note'])}</p>
  </div>''', side='l')

# ======================= C. Product Certification =======================
def product():
    P, R = 'prd', PRD; h = R['hero']; o = []
    o.append(f'''<section class="pg-hero p-hero" id="prd-top" data-scene="0" aria-labelledby="h-prd">
  <div class="wrap stage"><div class="txt">
    <span class="chip"{K(P,'hero','eyebrow')}>{E(h['eyebrow'])}</span>
    <h1 id="h-prd" class="h-lg" tabindex="-1"><span class="ln"{K(P,'hero','h1',0)}>{words(h['h1'][0])}</span> <span class="ln g2"{K(P,'hero','h1',1)}>{words(h['h1'][1])}</span> <span class="ln"{K(P,'hero','h1',2)}>{words(h['h1'][2])}</span></h1>
    <p class="tg"{K(P,'hero','tagline')}>{E(h['tagline'])}</p>
    <p class="lede"{K(P,'hero','p')}>{E(h['p'])}</p>
    <div class="acts">{cta(P,('hero','ctas',0),h['ctas'][0])}{cta(P,('hero','ctas',1),h['ctas'][1],'btn ghost')}</div>
    <div class="c108"><span class="v"{K(P,'hero','stat','value')}>{E(h['stat']['value'])}</span><span class="t"{K(P,'hero','stat','title')}>{E(h['stat']['title'])}</span><span class="d"{K(P,'hero','stat','desc')}>{E(h['stat']['desc'])}</span></div>
  </div>{art_prod()}</div>
</section>''')
    SEC.append((P, 'prd-top', h['eyebrow']))
    i_ = R['idea']
    o.append(sec(P, 'prd-idea', i_['label'], 1, f'''  <div class="wrap">
    <div class="stage c"><div class="txt" data-in><span class="k2"{K(P,'idea','label')}>{E(i_['label'])}</span><h2 class="h-lg"{K(P,'idea','h2')}>{E(i_['h2'])}</h2></div></div>
    <div class="idea" data-in><p class="first"{K(P,'idea','p',0)}>{E(i_['p'][0])}</p><div class="rest">{''.join(f'<p{K(P,"idea","p",j)}>{E(x)}</p>' for j, x in enumerate(i_['p'][1:], 1))}</div></div>
  </div>''', side='l'))
    f = R['founding']
    def tick_list(a, l): return '<ul>' + ''.join(f'<li{K(P, "founding", "lists", a, b)}>{E(x)}</li>' for b, x in enumerate(l)) + '</ul>'
    lists = ''.join(tick_list(a, l) for a, l in enumerate(f['lists']))
    o.append(sec(P, 'prd-founding', f['h2'], 2, f'''  <div class="wrap">
    <div class="stage"><div class="txt" data-in><h2 class="k2"{K(P,'founding','h2')}>{E(f['h2'])}</h2><h3 class="h-md"{K(P,'founding','h3')}>{E(f['h3'])}</h3>
      <p class="lede"><span{K(P,'founding','p',0)}>{E(f['p'][0])}</span><br><span{K(P,'founding','p',1)}>{E(f['p'][1])}</span></p></div>{art_invite('108')}</div>
    <div class="found" data-in><div class="glass ticks2">{lists}</div><p class="note"{K(P,'founding','note')}>{E(f['note'])}</p><div class="acts">{cta(P,('founding','cta'),f['cta'])}</div></div>
  </div>''', side='r'))
    ev = R['evaluate']
    p7 = ''.join(f'<li data-pillar="{i}"><span class="n"{K(P,"evaluate","pillars",i,"n")}>{E(x["n"])}</span><span class="t"{K(P,"evaluate","pillars",i,"title")}>{E(x["title"])}</span><p class="d"{K(P,"evaluate","pillars",i,"desc")}>{E(x["desc"])}</p></li>' for i, x in enumerate(ev['pillars']))
    o.append(sec(P, 'prd-evaluate', ev['h3'], 3, f'''  <div class="wrap">
    <div class="stage l">{art_bloom([x['n'] for x in ev['pillars']])}<div class="txt" data-in><h2 class="k2"{K(P,'evaluate','h2')}>{E(ev['h2'])}</h2><h3 class="h-lg"{K(P,'evaluate','h3')}>{E(ev['h3'])}</h3><p class="lede"{K(P,'evaluate','p')}>{E(ev['p'])}</p></div></div>
    <ul class="p7" data-in>{p7}<li class="total"><span{K(P,'evaluate','total')}>{E(ev['total'])}</span></li></ul>
  </div>''', side='l'))
    wy = R['why']
    o.append(sec(P, 'prd-why', wy['h2'], 4, f'''  <div class="wrap whyp">
    <div style="display:grid;gap:1rem" data-in><h2 class="k2"{K(P,'why','h2')}>{E(wy['h2'])}</h2><h3 class="h-md"{K(P,'why','h3')}>{E(wy['h3'])}</h3></div>
    <div class="glass pad" data-in><p class="q"{K(P,'why','p')}>{E(wy['p'])}</p></div>
  </div>''', side='r'))
    o.append(market(P, R['market']))
    j = R['journey']
    o.append(sec(P, 'prd-journey', j['h2'], 6, f'''  <div class="wrap journey">
    <div data-in><h2 class="h-md"{K(P,'journey','h2')}>{E(j['h2'])}</h2></div>
    <div data-in><ol class="j7" data-fill>{''.join(f'<li data-stepi="{i}"><span{K(P,"journey","steps",i)}>{E(s)}</span></li>' for i, s in enumerate(j['steps']))}<li class="run" aria-hidden="true"></li></ol>
      <p class="one"{K(P,'journey','p')}>{E(j['p'])}</p></div>
  </div>''', side='r'))
    pw = R['pathways']
    o.append(sec(P, 'prd-pathways', pw['h2'], 7, f'''  <div class="sunrise"><div class="in">
    <img class="mk" src="assets/cness-mark.svg" width="64" height="64" alt="" decoding="async">
    <p class="k2"{K(P,'pathways','h2')}>{E(pw['h2'])}</p><h2{K(P,'pathways','h3')}>{E(pw['h3'])}</h2>
    <p{K(P,'pathways','p',0)}>{E(pw['p'][0])}</p><p{K(P,'pathways','p',1)}>{E(pw['p'][1])}</p><p class="motto"{K(P,'pathways','p',2)}>{E(pw['p'][2])}</p>
    <div class="acts">{cta(P,('pathways','ctas',0),pw['ctas'][0],'btn dark')}<a class="btn line-dark" {href(pw['ctas'][1]['url'])}{K(P,'pathways','ctas',1)}>{E(pw['ctas'][1]['text'])}</a></div>
  </div></div>''', cls='dawn final'))
    return '\n'.join(o)

PAGES = [('mother-of-certification', 'moc', 'Mother of Certification', mother), ('cness-certification', 'org', 'Organization Certification', org), ('product-certification', 'prd', 'Product Certification', product)]
views = []
for route, key, title, fn in PAGES:
    views.append(f'<article class="pg" id="{route}" data-page="{key}" data-title="{E(title)}"{"" if route == PAGES[0][0] else " hidden"}>\n{fn()}\n</article>')

# ---------- site chrome (labels and destinations from the locked site inventory) ----------
Hd = SITE['header']
def navlink(l):
    return f'<a {href(l["url"])}>{E(l["text"])}</a>'.replace(' target="_blank" rel="noopener"', '')
nav = []
for n in Hd['nav']:
    if 'menu' in n:
        mid = 'm-' + n['text'].lower().replace(' ', '-'); cur = ' cur' if n['text'] == 'Certification' else ''
        nav.append(f'<li class="dd{cur}"><button type="button" aria-expanded="false" aria-controls="{mid}">{E(n["text"])} {I["chev"]}</button><div class="menu" id="{mid}">' + ''.join(navlink(x) for x in n['menu']) + '</div></li>')
    else: nav.append(f'<li>{navlink(n)}</li>')
reg = Hd['region']
reg_menu = ''.join(f'<a href="{B}{E(r["href"])}" lang="{"ja" if r["code"] == "JA" else "en"}"><span class="code">{E(r["code"])}</span>{E(r["text"])}</a>' for r in reg['menu'])
login, start = Hd['actions']
header = f'''<header class="top" id="top">
  <div class="wrap">
    <a class="brand" href="{E(Hd['logo']['url'])}"><img src="assets/logo-white.png" width="130" height="32" alt="CNESSWORKS home"></a>
    <nav aria-label="Main"><ul class="nav">{''.join(nav)}</ul></nav>
    <div class="right-acts">
      <div class="region dd"><button type="button" aria-expanded="false" aria-controls="m-region" aria-label="Region: {E(reg['text'])}">{E(reg['text'])} {I['chev']}</button><div class="menu right" id="m-region">{reg_menu}</div></div>
      <a class="login" href="{E(login['url'])}">{E(login['text'])}</a>
      <a class="btn sm" href="{E(start['url'])}">{E(start['text'])}</a>
      <button class="motion" id="motionBtn" type="button" aria-pressed="false" aria-label="Pause motion" title="Pause motion">
        <svg class="pause" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" stroke="currentColor" stroke-width="2" fill="none"/></svg>
        <svg class="play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5l7 4.5-7 4.5z" fill="currentColor"/></svg>
      </button>
      <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="sheet" aria-label="Open navigation menu"><i></i></button>
    </div>
  </div>
  <div class="bar" id="bar" aria-hidden="true"></div>
</header>'''
sheet_items = [navlink(Hd['mobileOnly'][0])]
for n in Hd['nav']:
    if 'menu' in n:
        sid = 's-' + n['text'].lower().replace(' ', '-'); cur = ' cur' if n['text'] == 'Certification' else ''
        sheet_items.append(f'<div class="grp{cur}"><button type="button" aria-expanded="{"true" if cur else "false"}" aria-controls="{sid}">{E(n["text"])} {I["chev"]}</button><div class="sub" id="{sid}"{"" if cur else " hidden"}>' + ''.join(navlink(x) for x in n['menu']) + '</div></div>')
    else: sheet_items.append(navlink(n))
sheet = f'''<div class="sheet" id="sheet" hidden><nav class="in" aria-label="Main">{''.join(sheet_items)}
  <div class="regions" role="group" aria-label="Region">{reg_menu}</div>
  <div class="acts"><a href="{E(login['url'])}">{E(login['text'])}</a><a class="btn" href="{E(start['url'])}">{E(start['text'])}</a></div>
</nav></div>'''
dots = ''.join(f'<nav aria-label="Sections" class="dotnav" data-for="{key}"{"" if key == "moc" else " hidden"}><ul class="dots">' + ''.join(f'<li><a href="#{sid}"><span>{E(lbl)}</span></a></li>' for p, sid, lbl in SEC if p == key) + '</ul></nav>' for _, key, _, _ in PAGES)
F = SITE['footer']
cols = []
for col in F['columns']:
    lis = []
    for l in col.get('links', col.get('items', [])):
        if 'href' in l: lis.append(f'<li><a {href(l["url"])}>{E(l["text"])}</a></li>')
        else:
            pid = 'tip-' + l['text'].lower().replace(' ', '-')
            lis.append(f'<li class="pop"><button type="button" aria-expanded="false" aria-controls="{pid}">{E(l["text"])}</button><span class="tip" id="{pid}" role="status" hidden>{E(l["text"])} opens on the live cnessworks.com site. <a href="{B}/" target="_blank" rel="noopener">Open cnessworks.com</a></span></li>')
    cols.append(f'<div><h3>{E(col["title"])}</h3><ul>{"".join(lis)}</ul></div>')
phones = ''.join(f'<span class="cp"><a href="{E(p["href"])}">{E(p["text"])}</a> <button type="button" data-copy="{E(p["text"].split(" ", 1)[1])}" aria-label="Copy {E(p["text"])}">Copy</button></span>' for p in F['phones'])
soc = ''.join(f'<a href="{E(s["url"])}" target="_blank" rel="noopener" aria-label="{E(s["text"])}">{SOCIAL[s["text"]]}</a>' for s in F['social'])
footer = f'''<footer>
  <div class="wrap">
    <div class="foot">
      <div class="about">
        <a class="brand" href="{B}/" target="_blank" rel="noopener"><img src="assets/logo-white.png" width="130" height="32" alt="CNESSWORKS home"></a>
        <p>{E(F['tagline'])}</p>
        <address><span>{E(F['address'])}</span>{phones}</address>
        <div class="soc">{soc}</div>
      </div>
      {''.join(cols)}
    </div>
    <p class="legal">{E(F['copyright'])}</p>
  </div>
</footer>'''
cert_menu = next(n for n in Hd['nav'] if n.get('text') == 'Certification')['menu']
switcher = f'''<nav class="switch" aria-label="{E('Certification')}"><div class="wrap"><ul>{''.join(f'<li><a {href(l["url"])}><span class="ix" aria-hidden="true">0{k + 1}</span>{E(l["text"])}</a></li>' for k, l in enumerate(cert_menu))}</ul></div></nav>'''
qa = SITE['quickActions']
quick = f'''<div class="quick">
  <button class="totop" id="totop" type="button" aria-label="Scroll to top" hidden>{I['up']}</button>
  <a class="qa" href="{E(qa[0]['url'])}" target="_blank" rel="noopener"><span class="lab"><b>{E(qa[0]['text'])}</b><small>{E(qa[0]['tag'])}</small></span><span class="ic">{I['analyze']}</span></a>
  <a class="qa" href="{E(qa[1]['url'])}" target="_blank" rel="noopener"><span class="lab"><b>{E(qa[1]['text'])}</b><small>{E(qa[1]['tag'])}</small></span><span class="ic">{I['grid']}</span></a>
</div>'''

page = f'''<title>CNESS Certification</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="{E(ORG['hero']['p'])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Onest:wght@300..700&display=swap">
<style>
{rd('src/advantage/style.css')}
{rd('src/certification/style.css')}</style>

<a class="skip" href="#main">Skip to content</a>
<div class="sky" aria-hidden="true"><i data-for="moc"></i><i data-for="org"></i><i data-for="prd"></i></div>
{header}
{sheet}
{dots}
<p class="sr" id="route-status" aria-live="polite"></p>

<main id="main">
{switcher}
{chr(10).join(views)}
</main>

{footer}
{quick}

<script>
{rd('src/certification/motion.js')}</script>
'''
(ROOT / 'src/certification.html').write_text(page, encoding='utf-8')
print(f'wrote src/certification.html ({len(page)//1024} KB): ' + ', '.join(f'{k} {sum(1 for p, *_ in SEC if p == k)} sections' for _, k, _, _ in PAGES))
