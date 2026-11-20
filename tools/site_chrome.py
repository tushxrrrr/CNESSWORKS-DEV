"""Shared CNESSWORKS site chrome (header, mobile sheet, footer, quick actions) for generated subpages.
Labels and destinations come from the locked site inventory content/cness-advantage.json; same markup as the
Certification and Advantage pages. `current` is the production URL of the page being built (gets aria-current)."""
import html, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = json.loads((ROOT / 'content/cness-advantage.json').read_text(encoding='utf-8'))
E = lambda s: html.escape(s, quote=True)
B = 'https://www.cnessworks.com'

def ic(d): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{d}</svg>'
I = {
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

def build(current):
    Hd = SITE['header']
    def navlink(l):
        cur = ' aria-current="page"' if l.get('url') == current else ''
        return f'<a href="{E(l["url"])}" data-prod-href="{E(l["url"])}"{cur}>{E(l["text"])}</a>'
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
    F = SITE['footer']; cols = []
    for col in F['columns']:
        lis = []
        for l in col.get('links', col.get('items', [])):
            if 'href' in l: lis.append(f'<li><a href="{E(l["url"])}" data-prod-href="{E(l["url"])}" target="_blank" rel="noopener">{E(l["text"])}</a></li>')
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
    qa = SITE['quickActions']
    quick = f'''<div class="quick">
  <button class="totop" id="totop" type="button" aria-label="Scroll to top" hidden>{I['up']}</button>
  <a class="qa" href="{E(qa[0]['url'])}" target="_blank" rel="noopener"><span class="lab"><b>{E(qa[0]['text'])}</b><small>{E(qa[0]['tag'])}</small></span><span class="ic">{I['analyze']}</span></a>
  <a class="qa" href="{E(qa[1]['url'])}" target="_blank" rel="noopener"><span class="lab"><b>{E(qa[1]['text'])}</b><small>{E(qa[1]['tag'])}</small></span><span class="ic">{I['grid']}</span></a>
</div>'''
    return header, sheet, footer, quick
