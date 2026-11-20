#!/usr/bin/env python3
"""Builds src/advantage.html (body fragment) from the locked content inventory.

Content:   content/cness-advantage.json  (captured from the live page; never edited by hand)
Styling:   src/advantage/style.css
Motion:    src/advantage/motion.js, src/advantage/field.js
Every approved string is copied verbatim from the JSON and marked with data-c="<type>" so that
tools/verify-advantage.js can compare the rendered page with the inventory item by item.
"""
import json, html, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
C = json.loads((ROOT / 'content/cness-advantage.json').read_text(encoding='utf-8'))
CSS = (ROOT / 'src/advantage/style.css').read_text(encoding='utf-8')
JS = (ROOT / 'src/advantage/motion.js').read_text(encoding='utf-8')
FIELD = (ROOT / 'src/advantage/field.js').read_text(encoding='utf-8')
E = lambda s: html.escape(s, quote=True)

# ---------- icons (decorative, 24px line set) ----------
def ic(d, extra=''):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"{extra}>{d}</svg>'
I = {
  'chat': ic('<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'),
  'check-list': ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 12l2 2 4-4.5"/><path d="M8.5 17.5h7"/>'),
  'steps': ic('<path d="M3 19h5v-5h5V9h5V4h3"/><circle cx="5.5" cy="10" r="1.6"/>'),
  'people': ic('<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.3.2 4 1.8 4.5 4.8"/>'),
  'bank': ic('<path d="M3 9.5L12 4l9 5.5"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7"/><path d="M3 20h18"/>'),
  'tag': ic('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>'),
  'beam': ic('<circle cx="12" cy="12" r="2.2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>'),
  'book': ic('<path d="M4 5.5C6.5 4.2 9.5 4.2 12 6c2.5-1.8 5.5-1.8 8-.5V19c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5z"/><path d="M12 6v13.5"/>'),
  'heart': ic('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  'seal': ic('<circle cx="12" cy="10" r="6"/><path d="M9.5 10l1.8 1.8 3.2-3.6"/><path d="M8.5 15.2L7 21l5-2.5 5 2.5-1.5-5.8"/>'),
  'talk': ic('<path d="M3 6h11v7H7l-4 3z"/><path d="M14 9h7v8l-3-2.4h-6V13"/>'),
  'flag': ic('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),
  'hands': ic('<circle cx="12" cy="6.5" r="2.5"/><path d="M4 13c2-1 4-.6 5.5.8L12 16l2.5-2.2c1.5-1.4 3.5-1.8 5.5-.8"/><path d="M4 18h16"/>'),
  'globe': ic('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5M12 3.5C9.4 5.9 8.2 8.7 8.2 12s1.2 6.1 3.8 8.5"/>'),
  'analyze': ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/><path d="M7.5 12l2-2.5 1.8 1.5 2.2-3"/>'),
  'grid': ic('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  'check': ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16 9.4"/>'),
  'minus': ic('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  'scale': ic('<path d="M12 4v16M7 20h10"/><path d="M5 7h14"/><path d="M5 7l-2.5 6a2.8 2.8 0 0 0 5 0z"/><path d="M19 7l-2.5 6a2.8 2.8 0 0 0 5 0z"/>'),
  'up': ic('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  'chev': '<svg class="chev" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
}
SOCIAL = {
  'Facebook': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg>',
  'YouTube': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
  'Instagram': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
  'LinkedIn': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.5 9h3v11h-3zM6 3.8A1.8 1.8 0 1 1 6 7.4a1.8 1.8 0 0 1 0-3.6zM10 9h2.9v1.5c.4-.8 1.4-1.7 3-1.7 3.1 0 3.6 2 3.6 4.7V20h-3v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V20H10z"/></svg>',
}
ARR = '<span class="arr" aria-hidden="true">→</span>'

# ---------- per-section presentation (keyed by the live eyebrow text) ----------
OFF = {
  'Trust Profile':                       dict(id='trust-profile', scene=1, icon='chat'),
  'Organization Certification':          dict(id='organization-certification', scene=2, icon='check-list', flip=True),
  'Aspiring · Level One':                dict(id='aspiring', scene=3, hi=0, icon='steps', emblem='aspiring'),
  'Inspired · Level Two':                dict(id='inspired', scene=3, hi=1, icon='people', emblem='inspired'),
  'Luminary · Level Three':              dict(id='luminary', scene=3, hi=2, icon='bank', emblem='luminary'),
  'Product Certification':               dict(id='product-certification', scene=4, icon='tag', flip=True),
  'Global Directory':                    dict(id='global-directory', scene=5, icon='beam'),
  'Partners and Business Connections':   dict(id='partners', scene=7, icon='people', flip=True),
  'Best Practices and Shared Knowledge': dict(id='best-practices', scene=8, icon='book'),
}
WAYS = ['heart', 'seal', 'talk', 'flag', 'hands', 'globe']
B = 'https://www.cnessworks.com'

items = C['main']; pos = 0
def take(t, text=None):
    global pos
    it = items[pos]
    if it['type'] != t or (text is not None and it['text'] != text):
        sys.exit(f"Inventory changed at item {pos}: expected {t} {text or ''}, found {it['type']} {it['text'][:60]!r}")
    pos += 1; return it
def peek(): return items[pos]['type'] if pos < len(items) else None
def cta(it, cls='btn', extra=''):
    return f'<a class="{cls}" data-c="a" href="{E(it["url"])}" target="_blank" rel="noopener"{extra}>{E(it["text"])} {ARR}</a>'

index = []      # (target id, kicker, title) for the hero index and the section dots
dots = []
out = []

# ---------- hero ----------
ey = take('eyebrow', 'CNESS Advantage'); h1 = take('h1'); p1 = take('p'); p2 = take('p')
h1_html = E(h1['text']).replace('the care behind', 'the <span class="g">care</span> behind', 1)
hero = f'''<section class="hero" id="advantage" data-scene="0" data-name="{E(ey['text'])}" aria-labelledby="h-hero">
  <div class="wrap inner">
    <span class="tag" data-c="eyebrow">{E(ey['text'])}</span>
    <h1 id="h-hero" data-c="h1" data-words>{h1_html}</h1>
    <p class="lede" data-c="p">{E(p1['text'])}</p>
    <p class="start" data-c="p">{E(p2['text'])}</p>
    %%INDEX%%
  </div>
</section>'''
dots.append(('advantage', ey['text']))

def offering():
    ey = take('eyebrow'); cfg = OFF[ey['text']]
    h3 = take('h3'); d = take('p'); a = take('a')
    cols = []
    for _ in range(3):
        lb = take('label'); lis = []
        while peek() == 'li': lis.append(take('li'))
        cols.append(f'<div class="col"><p class="lbl" data-c="label">{E(lb["text"])}</p><ul>' + ''.join(f'<li data-c="li">{E(x["text"])}</li>' for x in lis) + '</ul></div>')
    ml = take('label'); mq = take('means')
    use = ''
    if peek() == 'h4':
        h4 = take('h4'); up = take('p')
        use = f'<div class="use"><span class="ic">{I[cfg["icon"]]}</span><h4 data-c="h4">{E(h4["text"])}</h4><p data-c="p">{E(up["text"])}</p></div>'
    sid = cfg['id']
    emb = f'<img class="emb" src="assets/emblem-{cfg["emblem"]}.svg" width="76" height="76" alt="" decoding="async">' if cfg.get('emblem') else ''
    hi = f' data-hi="{cfg["hi"]}"' if 'hi' in cfg else ''
    index.append((sid, ey['text'], h3['text'])); dots.append((sid, ey['text']))
    return f'''<section class="off{' flip' if cfg.get('flip') else ''}" id="{sid}" data-scene="{cfg['scene']}"{hi} data-name="{E(ey['text'])}" aria-labelledby="h-{sid}">
  <div class="wrap">
    <div class="intro"><div class="txt" data-in>
      {emb}<span class="tag" data-c="eyebrow">{E(ey['text'])}</span>
      <h3 id="h-{sid}" data-c="h3">{E(h3['text'])}</h3>
      <p class="desc" data-c="p">{E(d['text'])}</p>
      <div class="acts">{cta(a)}</div>
    </div></div>
    <div class="det" data-in>
      <div class="cols">{''.join(cols)}</div>
      <div class="means{'' if use else ' solo'}"><div class="m"><p class="lbl" data-c="label">{E(ml['text'])}</p><p class="q" data-c="means">{E(mq['text'])}</p></div>{use}</div>
    </div>
  </div>
</section>'''

def statement():
    h = take('h2')
    return f'<section class="say" aria-label="{E(h["text"])}"><div class="wrap"><h2 data-c="h2" data-say>{E(h["text"])}</h2></div></section>'

def plans():
    h = take('h2', 'Choose your Global Directory plan'); intro = take('p')
    def plan(pro):
        name = take('h3'); s = take('p'); lis = []
        while peek() == 'li': lis.append(take('li'))
        a = take('a')
        rows = []
        for x in lis:
            t = x['text']
            if ' — ' in t:
                k, v = t.split(' — ', 1); body = f'<b>{E(k)}</b> — {E(v)}'
            else: body = E(t)
            icon = I['minus'] if t.startswith('No ') else I['check']
            rows.append(f'<li data-c="li"{" class=cap" if t.startswith("No ") else ""}>{icon}<span>{body}</span></li>')
        return name, s, rows, a
    fn, fs, fr, fa = plan(False)
    badge = take('badge')
    pn, ps, pr, pa = plan(True)
    note = take('p')
    lead = 'The same certification standards for every plan.'
    if not note['text'].startswith(lead + ' '): sys.exit('Plan note changed')
    note_html = f'<strong>{E(lead)}</strong> {E(note["text"][len(lead) + 1:])}'
    index.append(('plans', 'Global Directory', h['text'])); dots.append(('plans', h['text']))
    card = lambda cls, n, s, rows, a, hi, extra='': f'''<article class="plan{cls}" data-plan="{hi}" aria-labelledby="h-plan-{hi}">
        {extra}<h3 id="h-plan-{hi}" data-c="h3">{E(n['text'])}</h3>
        <p class="sum" data-c="p">{E(s['text'])}</p>
        <ul>{''.join(rows)}</ul>
        {cta(a, 'btn' if cls else 'btn ghost')}
      </article>'''
    return f'''<section class="plans-s" id="plans" data-scene="6" data-name="{E(h['text'])}" aria-labelledby="h-plans">
  <div class="wrap">
    <div class="plans-h" data-in><h2 id="h-plans" data-c="h2">{E(h['text'])}</h2><p class="lede" data-c="p">{E(intro['text'])}</p></div>
    <div class="plans" data-in>
      {card('', fn, fs, fr, fa, 0)}
      {card(' pro', pn, ps, pr, pa, 1, f'<span class="badge" data-c="badge">{E(badge["text"])}</span>')}
    </div>
    <p class="same" data-c="p" data-in>{I['scale']}<span>{note_html}</span></p>
  </div>
</section>'''

def superapp():
    h = take('h2', 'Connect with people through the CNESS SuperApp'); intro = take('p'); ways = []
    while peek() == 'h3':
        t = take('h3'); d = take('p'); k = len(ways)
        ways.append(f'<li class="way" data-way="{k}"><span class="ic">{I[WAYS[k]]}</span><h3 data-c="h3">{E(t["text"])}</h3><p data-c="p">{E(d["text"])}</p></li>')
    a = take('a')
    index.append(('superapp', 'CNESS SuperApp', h['text'])); dots.append(('superapp', 'CNESS SuperApp'))
    return f'''<section class="app" id="superapp" data-scene="9" data-name="CNESS SuperApp" aria-labelledby="h-app">
  <div class="wrap">
    <div class="app-h" data-in><h2 id="h-app" data-c="h2">{E(h['text'])}</h2><p class="lede" data-c="p">{E(intro['text'])}</p></div>
    <ul class="ways" data-in>{''.join(ways)}</ul>
    <div class="acts">{cta(a)}</div>
  </div>
</section>'''

def final():
    h = take('h2', 'Find your starting point'); p = take('p'); a1 = take('a'); a2 = take('a')
    index.append(('start', 'Analyze', h['text'])); dots.append(('start', h['text']))
    return f'''<section class="final" id="start" data-scene="10" data-name="{E(h['text'])}" aria-labelledby="h-start">
  <div class="sunrise"><div class="in">
    <img class="mk" src="assets/cness-mark.svg" width="64" height="64" alt="" decoding="async">
    <h2 id="h-start" data-c="h2">{E(h['text'])}</h2>
    <p data-c="p">{E(p['text'])}</p>
    <div class="acts">{cta(a1, 'btn dark')}<a class="btn line-dark" data-c="a" href="{E(a2['url'])}" target="_blank" rel="noopener">{E(a2['text'])}</a></div>
  </div></div>
</section>'''

body = [hero]
in_levels = False
while pos < len(items):
    t = peek()
    if t == 'eyebrow':
        ey = items[pos]['text']
        if ey == 'Aspiring · Level One': body.append('<div class="levels" id="levels"><div class="rail" aria-hidden="true"><i></i></div>'); in_levels = True
        body.append(offering())
        if ey == 'Luminary · Level Three': body.append('</div>'); in_levels = False
    elif t == 'h2':
        tx = items[pos]['text']
        if tx == 'Choose your Global Directory plan': body.append(plans())
        elif tx == 'Connect with people through the CNESS SuperApp': body.append(superapp())
        elif tx == 'Find your starting point': body.append(final())
        else: body.append(statement())
    else: sys.exit(f'Unexpected item {pos}: {items[pos]}')
assert pos == len(items) and not in_levels

idx_html = '<nav aria-label="On this page"><ul class="idx">' + ''.join(
    f'<li><a href="#{i}"><span class="k">{E(k)}</span><span class="t">{E(t)}</span></a></li>' for i, k, t in index) + '</ul></nav>'
body[0] = body[0].replace('%%INDEX%%', idx_html)

# ---------- header ----------
Hd = C['header']
def navlink(l, cls=''):
    cur = ' aria-current="page"' if l['href'] == '/cness-advantage' else ''
    return f'<a{cls} href="{E(l["url"])}"{cur}>{E(l["text"])}</a>'
nav = []
for n in Hd['nav']:
    if 'menu' in n:
        mid = 'm-' + n['text'].lower().replace(' ', '-')
        nav.append(f'<li class="dd"><button type="button" aria-expanded="false" aria-controls="{mid}">{E(n["text"])} {I["chev"]}</button><div class="menu" id="{mid}">' + ''.join(navlink(x) for x in n['menu']) + '</div></li>')
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
        sid = 's-' + n['text'].lower().replace(' ', '-')
        sheet_items.append(f'<div class="grp"><button type="button" aria-expanded="false" aria-controls="{sid}">{E(n["text"])} {I["chev"]}</button><div class="sub" id="{sid}" hidden>' + ''.join(navlink(x) for x in n['menu']) + '</div></div>')
    else: sheet_items.append(navlink(n))
sheet = f'''<div class="sheet" id="sheet" hidden><nav class="in" aria-label="Main">{''.join(sheet_items)}
  <div class="regions" role="group" aria-label="Region">{reg_menu}</div>
  <div class="acts"><a href="{E(login['url'])}">{E(login['text'])}</a><a class="btn" href="{E(start['url'])}">{E(start['text'])}</a></div>
</nav></div>'''
dots_html = '<nav aria-label="Sections"><ul class="dots" id="dots">' + ''.join(f'<li><a href="#{i}"><span>{E(n)}</span></a></li>' for i, n in dots) + '</ul></nav>'

# ---------- footer ----------
F = C['footer']
cols = []
for col in F['columns']:
    lis = []
    for l in col.get('links', col.get('items', [])):
        if 'href' in l: lis.append(f'<li><a href="{E(l["url"])}" target="_blank" rel="noopener">{E(l["text"])}</a></li>')
        else:
            pid = 'tip-' + l['text'].lower().replace(' ', '-')
            lis.append(f'<li class="pop"><button type="button" aria-expanded="false" aria-controls="{pid}">{E(l["text"])}</button><span class="tip" id="{pid}" role="status" hidden>{E(l["text"])} opens on the live cnessworks.com site. <a href="{B}/cness-advantage" target="_blank" rel="noopener">Open cnessworks.com</a></span></li>')
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
qa = C['quickActions']
quick = f'''<div class="quick">
  <button class="totop" id="totop" type="button" aria-label="Scroll to top" hidden>{I['up']}</button>
  <a class="qa" href="{E(qa[0]['url'])}" target="_blank" rel="noopener"><span class="lab"><b>{E(qa[0]['text'])}</b><small>{E(qa[0]['tag'])}</small></span><span class="ic">{I['analyze']}</span></a>
  <a class="qa" href="{E(qa[1]['url'])}" target="_blank" rel="noopener"><span class="lab"><b>{E(qa[1]['text'])}</b><small>{E(qa[1]['tag'])}</small></span><span class="ic">{I['grid']}</span></a>
</div>'''

page = f'''<title>CNESS Advantage</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="{E(p1['text'])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Onest:wght@300..700&display=swap">
<style>
{CSS}</style>

<a class="skip" href="#main">Skip to content</a>
<div class="sky" aria-hidden="true"></div>
<div class="field" id="field" aria-hidden="true"><canvas id="f2d"></canvas></div>
<div class="grain" aria-hidden="true"></div>
{header}
{sheet}
{dots_html}

<main id="main">
{chr(10).join(body)}
</main>

{footer}
{quick}

<script>
{JS}</script>
<script type="importmap">
{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}}}
</script>
<script type="module">
{FIELD}</script>
'''
(ROOT / 'src/advantage.html').write_text(page, encoding='utf-8')
print(f'wrote src/advantage.html ({len(page)//1024} KB, {len(items)} content items)')
