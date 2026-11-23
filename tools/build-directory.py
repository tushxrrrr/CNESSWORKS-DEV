"""Global Directory page: src/directory.html (body fragment; build.sh wraps it into ./directory.html).

Content: content/global-directory.json (approved strings and destinations, from tools/directory_data.py).
Data:    assets/directory/data.json (snapshot records and the directory service's answers), loaded by the page.
Chrome:  tools/site_chrome.py (shared header, menu, footer and quick actions; same as the other subpages).
Presentation: src/advantage/style.css (shared system) + src/directory/style.css. Behaviour: src/directory/app.js.

Every approved string carries data-k="gd:<path>" so tools/verify-directory.js can compare the page with the inventory.
Elements that exist only in this preview (the data-scope note) carry data-preview; functional labels added for
accessibility or states the live page lacks (close, retry, load error) carry data-ui. Both are listed by the verifier.
"""
import html, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from site_chrome import build as chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
C = json.loads((ROOT / 'content/global-directory.json').read_text(encoding='utf-8'))
E = lambda s: html.escape(s, quote=True)
rd = lambda p: (ROOT / p).read_text(encoding='utf-8')
UI = json.loads(rd('src/directory/ui.json'))   # functional and preview-only strings, shared with the Next.js page
LIVE = 'https://www.cnessworks.com/globaldirectory'


def K(*path): return f' data-k="gd:{".".join(str(p) for p in path)}"'


def ic(d, sw='1.5'): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{d}</svg>'


I = {
    'chev': '<svg class="chev" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    'x': ic('<path d="M6 6l12 12M18 6L6 18"/>', '2'),
    'search': ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>', '2'),
    'prev': ic('<path d="M15 5l-7 7 7 7"/>', '1.8'), 'next': ic('<path d="M9 5l7 7-7 7"/>', '1.8'),
    'check': ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', '2'),
    'plus': ic('<path d="M12 5v14M5 12h14"/>', '1.6'),
    'arrow': '<span class="arr" aria-hidden="true">→</span>',
}
# Focus areas: original line marks, one per shortcut (no imagery borrowed from the live page)
FOCUS_IC = {
    'IT Services': ic('<rect x="4" y="4.5" width="16" height="5.5" rx="1.4"/><rect x="4" y="14" width="16" height="5.5" rx="1.4"/><path d="M7.5 7.25h.01M7.5 16.75h.01M11 7.25h5M11 16.75h5M12 10v4"/>'),
    'Restaurants': ic('<path d="M7 3.5v7.5M4.8 3.5v4.2a2.2 2.2 0 0 0 4.4 0V3.5M7 11v9.5"/><path d="M17 20.5v-17c-2.2 1-3.4 3.6-3.4 6.6 0 2 .9 3.2 3.4 3.4"/>'),
    'Wellness': ic('<path d="M12 20c-4.6-2.3-7.5-5.6-7.5-9.4A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.5 2c0 3.8-2.9 7.1-7.5 9.4z"/><path d="M8.5 13h2l1-2.2 1.6 4 .9-1.8h1.5"/>'),
    'Technology': ic('<rect x="6.5" y="6.5" width="11" height="11" rx="2"/><rect x="9.6" y="9.6" width="4.8" height="4.8" rx=".8"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>'),
    'Sustainability': ic('<path d="M12 20.5v-7"/><path d="M12 13.5c0-4 2.6-6.6 7-6.8.1 4.3-2.7 6.8-7 6.8z"/><path d="M12 15.5C12 12.2 9.9 10 6 10c0 3.4 2.2 5.5 6 5.5z"/><path d="M4.5 20.5h15"/>'),
    'Consulting': ic('<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3.2A2.5 2.5 0 0 1 4 10.5z"/><path d="M18.2 9.2A2.4 2.4 0 0 1 20 11.5v3.8a2.4 2.4 0 0 1-1.6 2.3V20l-3-2.5h-3"/>'),
}


def words(s): return ' '.join(f'<span class="w" style="--i:{i}">{E(w)}</span>' for i, w in enumerate(s.split(' ')))


def field(key, lab_path):
    f = C['search'][key]
    return f'''<div class="fld" data-field="{key}">
        <button type="button" class="fld-btn" id="f-{key}" aria-expanded="false" aria-controls="p-{key}" aria-haspopup="dialog">
          <span class="fl"{K('search', key, 'label')}>{E(f['label'])}</span>
          <span class="fv" data-ph="{E(f['placeholder'])}"><span class="ph"{K('search', key, 'placeholder')}>{E(f['placeholder'])}</span></span>
          {I['chev']}
        </button>
        <button type="button" class="fx" data-clear="{key}" aria-label="{E(C['search']['clear'])}"{K('search', 'clear') if key == 'what' else ''} hidden>{I['x']}</button>
        <div class="panel" id="p-{key}" role="dialog" aria-label="{E(f['label'])}" hidden></div>
      </div>'''


def filters(inst):
    F = C['filters']
    def sel(name, ph, opts, all_label):
        o = f'<option value="All">{E(all_label)}</option>' + ''.join(f'<option value="{E(v)}">{E(l)}</option>' for v, l in opts)
        return (f'<label class="sel" data-f="{name}"><span class="sv"{K("filters", name, "placeholder") if inst == "list" else ""}>{E(ph)}</span>'
                f'<select aria-label="{E(ph)}" data-f="{name}">{o}</select>{I["chev"]}</label>')
    return f'''<div class="filters" data-inst="{inst}">
      {sel('badge', F['badge']['placeholder'], F['badge']['options'], 'All ' + F['badge']['placeholder'] + 's')}
      {sel('size', F['size']['placeholder'], F['size']['options'], 'All ' + F['size']['placeholder'] + 's')}
      {sel('industry', F['industry']['placeholder'], [], F['industry']['all'])}
      {sel('country', F['country']['placeholder'], [], F['country']['all'])}
      <label class="chk"><input type="checkbox" data-f="certified"><span class="box" aria-hidden="true">{I['check']}</span><span{K('filters', 'certified') if inst == 'list' else ''}>{E(F['certified'])}</span></label>
      <button type="button" class="clr" data-clear-filters hidden>{I['x']}<span{K('filters', 'clear') if inst == 'list' else ''}>{E(F['clear'])}</span></button>
    </div>'''


def plan_card(p):
    prem = p['id'] == 'premium'
    feats = ''.join(f'<li>{I["check"]}<span><b{K("plans", p["id"], "features", i, 0)}>{E(a)}</b><span{K("plans", p["id"], "features", i, 1)}>{E(b)}</span></span></li>' for i, (a, b) in enumerate(p['features']))
    pts = ''.join(f'<li class="pt">{I["check"]}<span{K("plans", p["id"], "points", i)}>{E(x)}</span></li>' for i, x in enumerate(p['points']))
    extra = (f'<span class="pbadge"{K("plans", "premiumBadge")}>{E(C["plans"]["premiumBadge"])}</span>'
             f'<span class="psup"{K("plans", "premiumSupport")}>{E(C["plans"]["premiumSupport"])}</span>') if prem else ''
    return f'''<article class="plan-card {p['id']}" data-plan-card="{p['id']}" hidden>
        {extra}
        <h3{K('plans', p['id'], 'title')}>{E(p['title'].strip())}</h3>
        <p class="plead"{K('plans', p['id'], 'lead')}>{E(p['lead'])}</p>
        <ul>{pts}{feats}</ul>
      </article>'''


CARD_STR = {k: C['card'][k] for k in ('bookmark', 'bookmarkTitle', 'ratingTitle', 'outOf5', 'globalRating', 'star', 'signIn', 'details', 'tiers', 'profile', 'login')}
STRINGS = {  # what the script renders (cards, filter options, panels, pagination, states), as approved
    'search': C['search'], 'focus': C['focus'], 'filters': C['filters'], 'pagination': C['pagination'], 'card': CARD_STR,
    'featured': C['featured'], 'listed': C['listed'], 'plans': {'destinations': C['plans']['destinations']},
    'ui': UI['ui'],
}

how = ''.join(f'<li><span class="n" aria-hidden="true">0{i + 1}</span><h3{K("how", "steps", i, "title")}>{E(s["title"])}</h3><p{K("how", "steps", i, "text")}>{E(s["text"])}</p></li>' for i, s in enumerate(C['how']['steps']))
benefits = ''.join(f'<div class="bcol"><h2{K("benefits", i, "title")}>{E(b["title"])}</h2><ul>' + ''.join(f'<li{K("benefits", i, "items", j)}>{E(x)}</li>' for j, x in enumerate(b['items'])) + '</ul></div>' for i, b in enumerate(C['benefits']))
focus = ''.join(f'<li><button type="button" class="fchip" data-focus="{E(f)}"><span class="fi">{FOCUS_IC[f]}</span><span{K("focus", "items", i)}>{E(f)}</span></button></li>' for i, f in enumerate(C['focus']['items']))
tiers = C['card']['tiers']
legend = (f'<li><i class="lg ring" aria-hidden="true"></i><span{K("featured", "heading")}>{E(C["featured"]["heading"])}</span></li>'
          + ''.join(f'<li><i class="lg t-{t}" aria-hidden="true"></i><span>{E(tiers[t])}</span></li>' for t in ('aspiring', 'inspired', 'luminary')))
faq_tabs = ''.join(f'<button type="button" role="tab" id="faq-t{i}" aria-controls="faq-p{i}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}"{K("faq", "tabs", i, "name")}>{E(t["name"])}</button>' for i, t in enumerate(C['faq']['tabs']))


def answer(i, j, a):
    items = ''.join(f'<li{K("faq", "tabs", i, "items", j, "a", "items", k)}>{E(x)}</li>' for k, x in enumerate(a['items']))
    return f'<p{K("faq", "tabs", i, "items", j, "a", "lead")}>{E(a["lead"])}</p>' + (f'<ul>{items}</ul>' if items else '')


faq_panels = ''.join(
    f'<div class="faq-p" role="tabpanel" id="faq-p{i}" aria-labelledby="faq-t{i}"{"" if i == 0 else " hidden"}>' + ''.join(
        f'<div class="qa-i"><h3><button type="button" class="qa-q" aria-expanded="false" aria-controls="faq-a{i}-{j}" id="faq-q{i}-{j}"><span class="pm" aria-hidden="true"></span><span{K("faq", "tabs", i, "items", j, "q")}>{E(it["q"])}</span></button></h3>'
        f'<div class="qa-a" id="faq-a{i}-{j}" role="region" aria-labelledby="faq-q{i}-{j}" hidden><div>{answer(i, j, it["a"])}</div></div></div>'
        for j, it in enumerate(t['items'])) + '</div>' for i, t in enumerate(C['faq']['tabs']))

header, sheet, footer, quick = chrome(LIVE)

page = f'''<title>CNESS Global Directory</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="{E(C['metaDescription'])}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Onest:wght@300..700&display=swap">
<style>
{rd('src/advantage/style.css')}
{rd('src/directory/style.css')}</style>

<a class="skip" href="#main">Skip to content</a>
<div class="sky" aria-hidden="true"><i class="graticule"></i></div>
{header}
{sheet}

<main id="main" data-gd data-src="assets/directory/data.json">

<section class="gd-hero" aria-labelledby="h-gd">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 id="h-gd"{K('hero', 'h1')}>{words(C['hero']['h1'])}</h1>
      <p class="lede"{K('hero', 'lede')}>{E(C['hero']['lede'])}</p>
      <div class="acts plan-btns">
        <button type="button" class="btn ghost" data-plan="free"{K('hero', 'free')}>{E(C['hero']['free'])}</button>
        <button type="button" class="btn" data-plan="premium"{K('hero', 'premium')}>{E(C['hero']['premium'])}</button>
      </div>
    </div>
    <figure class="lens" data-lens="hero" aria-hidden="true">
      <div class="lens-stage"><canvas></canvas><div class="lens-n"><b data-lens-n>&nbsp;</b><span>Entries</span></div><div class="lens-tip" hidden></div></div>
      <ul class="legend">{legend}</ul>
    </figure>
    <form class="console" role="search" aria-label="{E('Choose what you want to search')}" novalidate>
      {field('what', 'what')}
      <span class="div" aria-hidden="true"></span>
      {field('where', 'where')}
      <button type="submit" class="btn go">{I['search']}<span{K('search', 'button')}>{E(C['search']['button'])}</span></button>
      <p class="err" role="alert" hidden><span{K('search', 'error')}>{E(C['search']['error'])}</span></p>
    </form>
    <section class="benefits" aria-label="Global Directory benefits">{benefits}</section>
    <div class="focus">
      <p class="focus-l"{K('focus', 'label')}>{E(C['focus']['label'])}</p>
      <ul>{focus}</ul>
    </div>
  </div>
</section>

<section class="how" aria-labelledby="h-how">
  <div class="wrap">
    <h2 id="h-how"{K('how', 'heading')}>{E(C['how']['heading'])}</h2>
    <ol>{how}</ol>
  </div>
</section>

<div class="wrap">
  <details class="scope" data-preview>
    <summary><span class="dot" aria-hidden="true"></span><b>{E(UI['scope']['title'])}</b><span>{E(UI['scope']['summary'])}</span>{I['plus']}</summary>
    <div class="scope-b">{''.join(f'<p>{x}</p>' for x in UI['scope']['paragraphs'])}</div>
  </details>
</div>

<section class="sec feat" id="featured-companies-section" aria-labelledby="h-feat">
  <div class="wrap">
    <div class="sec-h">
      <h2 id="h-feat"{K('featured', 'heading')}>{E(C['featured']['heading'])}</h2>
      <div class="sec-tools">{filters('feat')}
        <div class="arrows"><button type="button" class="arw" data-step="-1" aria-label="{E(C['featured']['prev'])}"{K('featured', 'prev')}>{I['prev']}</button><button type="button" class="arw" data-step="1" aria-label="{E(C['featured']['next'])}"{K('featured', 'next')}>{I['next']}</button></div>
      </div>
    </div>
    <div class="frail" data-rail><ul class="cards track" data-featured aria-labelledby="h-feat"></ul></div>
    <p class="empty" data-feat-empty hidden></p>
    <div class="dots-row" data-dots></div>
  </div>
</section>

<section class="sec list" id="listed-companies-section" aria-labelledby="h-list">
  <div class="wrap">
    <div class="sec-h"><h2 id="h-list"{K('listed', 'heading')}>{E(C['listed']['heading'])}</h2></div>
    <div class="list-grid">
      <div class="side">
        <figure class="lens mini" data-lens="mini" aria-hidden="true"><div class="lens-stage"><canvas></canvas><div class="lens-tip" hidden></div></div></figure>
        {filters('list')}
      </div>
      <div class="results">
        <div class="status"><p class="showing" data-showing aria-live="polite"></p><button type="button" class="prov" data-prov aria-expanded="false" aria-controls="prov-note" hidden></button><p class="prov-note" id="prov-note" hidden></p></div>
        <ul class="cards grid" data-listed aria-labelledby="h-list"></ul>
        <div class="state" data-state hidden></div>
        <nav class="pager" data-pager aria-label="{E(C['pagination']['navAria'])}" hidden></nav>
      </div>
    </div>
  </div>
</section>

<section class="sec faq" aria-labelledby="h-faq">
  <div class="wrap">
    <div class="faq-h"><h2 id="h-faq"{K('faq', 'heading')}>{E(C['faq']['heading'])}</h2><p{K('faq', 'sub')}>{E(C['faq']['sub'])}</p></div>
    <div class="faq-body">
      <div class="faq-tabs" role="tablist" aria-labelledby="h-faq">{faq_tabs}</div>
      <div class="faq-panels">{faq_panels}</div>
    </div>
  </div>
</section>

<section class="dawnband" aria-labelledby="h-cta">
  <div class="wrap"><div class="dawn-in">
    <div><h2 id="h-cta"{K('cta', 'heading')}>{E(C['cta']['heading'])}</h2><p{K('cta', 'text')}>{E(C['cta']['text'])}</p></div>
    <a class="btn dark" href="{E(C['cta']['url'])}" data-prod-href="{E(C['cta']['url'])}" target="_blank" rel="noopener"><span{K('cta', 'button')}>{E(C['cta']['button'])}</span> {I['arrow']}</a>
  </div></div>
</section>

</main>

{footer}
{quick}

<dialog class="pdlg" id="plan-dialog" aria-labelledby="pd-title">
  <div class="pd-h">
    <h2 id="pd-title"{K('plans', 'title')}>{E(C['plans']['title'])}</h2>
    <p{K('plans', 'lead')}>{E(C['plans']['lead'])}</p>
    <button type="button" class="pd-x" data-close aria-label="Close" data-ui>{I['x']}</button>
  </div>
  <div class="pd-b" tabindex="0" role="region" aria-labelledby="pd-title">
    {''.join(plan_card(p) for p in C['plans']['items'])}
    <p class="pd-disc"{K('plans', 'disclaimer')}>{E(C['plans']['disclaimer'])}</p>
  </div>
  <div class="pd-f"><a class="btn" data-explore href="{E(C['plans']['destinations']['free']['signedOut'])}" target="_blank" rel="noopener"><span{K('plans', 'explore')}>{E(C['plans']['explore'])}</span> {I['arrow']}</a></div>
</dialog>
<div class="rpop" id="rpop" role="dialog" aria-label="{E(C['card']['ratingTitle'])}" hidden></div>
<p class="sr" id="gd-live" aria-live="polite"></p>

<script type="application/json" id="gd-strings">{json.dumps(STRINGS, ensure_ascii=False).replace('</', '<\\/')}</script>
<script>
{rd('src/directory/app.js')}</script>
'''
(ROOT / 'src/directory.html').write_text(page, encoding='utf-8')
print('wrote src/directory.html', len(page), 'bytes')
