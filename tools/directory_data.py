"""Global Directory: locked content and snapshot data, derived from tools/data/directory-source.json.

directory-source.json was captured on 23 November 2026 from https://www.cnessworks.com/globaldirectory: the page's
English strings (its translation dictionary and the strings written into its components), the directory service's
records (490 listed + 16 featured, every page), its country and industry lists, and its answers to every badge,
size, country and certified filter, eight industry filters, the six focus areas and nine typed searches.
Nothing here is rewritten: strings and records are copied as served.

Writes
  content/global-directory.json   approved interface content and link destinations (verified by tools/verify-directory.js)
  assets/directory/data.json      records and service answers the page searches in the preview
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = json.loads((ROOT / 'tools/data/directory-source.json').read_text(encoding='utf-8'))
G, CA, H = SRC['globalDir'], SRC['cnessAdvantagePage'], SRC['hardCoded']
B = 'https://www.cnessworks.com'


def plan(p):
    return {'id': p['id'], 'title': CA[p['titleKey']], 'lead': CA[p['leadKey']], 'points': [CA[k] for k in p['points']],
            'features': [[CA[a], CA[b]] for a, b in p['features']]}


def faq_answer(a):
    """The answers are stored as one string; text before the first bullet is the lead, each bullet an item."""
    parts = [x.strip() for x in a.split('•')]
    return {'lead': parts[0], 'items': parts[1:]} if len(parts) > 1 else {'lead': a, 'items': []}


after = '/createtrustprofile/GetStarted?listing='
content = {
    'source': SRC['page'], 'captured': SRC['captured'], 'service': SRC['service'],
    'documentTitle': SRC['documentTitle'], 'metaDescription': SRC['metaDescription'],
    'hero': {'h1': G['heroTitle'], 'lede': G['heroListingOptions'], 'free': G['heroFreeBtn'], 'premium': G['heroPremiumBtn']},
    'plans': {'title': CA['certPlansTitle'], 'lead': G['planDialogLead'], 'explore': G['planDialogExploreMore'], 'disclaimer': CA['certPlansDisclaimer'],
              'premiumBadge': CA['certPlanPremiumBadge'], 'premiumSupport': CA['certPlanPremiumSupport'],
              'items': [plan(p) for p in H['plans']],
              # Explore more: signed-in visitors go to the listing flow; everyone else to log in first (this preview is never signed in)
              'destinations': {p['id']: {'signedIn': B + after + p['id'], 'signedOut': B + '/login?redirect=' + re.sub(r'[/?=]', lambda m: {'/': '%2F', '?': '%3F', '=': '%3D'}[m.group()], after + p['id'])} for p in H['plans']}},
    'search': {'what': {'label': G['searchWhatLabel'], 'placeholder': G['searchWhatPlaceholder']},
               'where': {'label': G['searchWhereLabel'], 'placeholder': G['searchWherePlaceholder']},
               'button': G['searchBtn'], 'error': G['searchErrorMsg'], 'clear': G['ariaClearSearch'],
               'wherePanel': {'placeholder': G['searchTypeToSearch'], 'noMatches': G['searchNoMatches'], 'recent': H['locationPanel']['recent']},
               'whatPanel': H['industryPanel']},
    'benefits': H['benefits'],
    'focus': {'label': G['heroBrowseLabel'], 'items': H['focusShown'], 'synonyms': H['focusSynonyms']},
    'how': {'heading': G['howItWorksHeading'], 'steps': [{'title': G[f'howItWorksStep{i}Title'], 'text': G[f'howItWorksStep{i}Desc']} for i in (1, 2, 3)]},
    'featured': {'heading': G['featuredCompaniesHeading'], 'empty': G['featuredEmptyState'], 'prev': G['ariaPreviousCompanies'], 'next': G['ariaNextCompanies'], 'slide': G['ariaGoToSlide']},
    'listed': {'heading': G['listedCompaniesHeading'], 'empty': G['listedEmptyState']},
    'filters': {'badge': {'placeholder': G['filterBadgePlaceholder'], 'options': [[v, G['tier' + v]] for v in ('Aspiring', 'Inspired', 'Luminary')]},
                'size': {'placeholder': G['filterSizePlaceholder'], 'options': [[v, G['filterSize' + v]] for v in ('Micro', 'Small', 'Medium', 'Large', 'Enterprise')]},
                'industry': {'placeholder': G['filterOrgTypePlaceholder'], 'all': G['filterAllTypes']},
                'country': {'placeholder': G['filterCountryPlaceholder'], 'all': G['filterAllCountries']},
                'certified': G['filterCertifiedOnly'], 'clear': G['filterClearBtn']},
    'pagination': {'previous': G['paginationPrevious'], 'next': G['paginationNext'], 'goTo': G['paginationGoTo'], 'page': G['paginationPageWord'],
                   'goToAria': G['paginationGoToPageAria'], 'showing': G['paginationShowing'], 'prevAria': G['ariaPreviousPage'], 'nextAria': G['ariaNextPage'],
                   'navAria': H['pagination']['ariaLabel']},
    'card': {'bookmark': G['cardBookmark'], 'bookmarkTitle': G['tooltipLoginBookmark'], 'ratingTitle': G['tooltipRatingBreakdown'],
             'outOf5': G['ratingOutOf5'], 'globalRating': G['ratingGlobalRatings'], 'star': G['ratingStar'], 'signIn': G['ratingSignInLink'],
             'details': H['cardAria'], 'tiers': {v.lower(): G['tier' + v] for v in ('Aspiring', 'Inspired', 'Luminary')},
             'profile': B + '/directory-detail/{slug}', 'login': B + '/login'},
    'faq': {'heading': G['faqHeading'], 'sub': G['faqSubheading'],
            'tabs': [{'name': G['faqTab' + t], 'items': [{'q': G[f'faq{k}Q{i}'], 'a': faq_answer(G[f'faq{k}A{i}'])} for i in (1, 2, 3)]}
                     for t, k in (('Certification', 'Cert'), ('General', 'General'), ('GlobalDirectory', 'Dir'), ('Partner', 'Partner'))]},
    'cta': {'heading': G['ctaHeading'], 'text': G['ctaSubtext'], 'button': G['ctaBtn'], 'url': B + '/signup'},
}

# ---------- records and service answers ----------
POSTAL = re.compile(r'^(?:[A-Z]\d[A-Z]\s?\d[A-Z]\d|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}|\d{5}(?:-\d{4})?)$', re.I)


def ws(s): return re.sub(r'[\s  -​﻿]+', ' ', s).strip()


def description(o):
    """The live card's description rule without its fallback: the first non-empty text field that is not a postal code.
    Where a record has none, the live page shows a generic sentence; here the description stays empty."""
    for k in ('description', 'conscious_commitment', 'mission_vision', 'mission_statement', 'what_they_stand_for'):
        v = ws(re.sub(r'<[^>]+>', ' ', str(o.get(k) or '')))
        if v and not (len(v) <= 12 and POSTAL.match(v)): return v
    return ''


def tier(o):
    t = (o.get('badge_type') or '').lower()
    return 'luminary' if 'luminary' in t else 'inspired' if 'inspired' in t else 'aspiring' if 'aspiring' in t else ''


def rec(o, featured, chunk):
    r = o.get('rating') or {}
    return {'id': o['id'], 'k': o.get('slug') or o['id'], 'n': o.get('name') or '', 'c': o.get('industry') or o.get('industry_sector') or '',
            's': o.get('industry_sectors') or [], 'z': (o.get('size') or '').lower(), 'co': o.get('country') or '', 'cr': o.get('country_region') or '',
            'cf': o.get('country_region_full') or '', 'd': description(o), 'w': o.get('website') or '', 'b': tier(o), 'a': o.get('awarded_at') or '',
            'p': bool(o.get('listing_paid')), 'f': featured, 'ra': r.get('average') or 0, 'rc': r.get('count') or 0,
            'rf': (o.get('ranking') or {}).get('final') or 0, 'im': o.get('list_image_url') or '', 'ic': chunk}


records = [rec(o, False, i // 24) for i, o in enumerate(SRC['listed'])] + [rec(o, True, 'f') for o in SRC['featured']]


def flatten(nodes, category='', primary=''):  # the live page's industry list builder (active entries only)
    out = []
    for n in nodes:
        if not n.get('is_active'): continue
        cat = n['name'] if n['level'] == 1 else category
        out.append({'name': n['name'], 'level': n['level'], 'category': cat, **({'primaryParent': primary} if n['level'] == 3 and primary else {})})
        if n.get('children'): out += flatten(n['children'], cat, n['name'] if n['level'] == 2 else primary)
    return out


# Keyed by endpoint and its parameters (sorted pairs as JSON), so the page can build the same key: listed|[["country","India"]].
# Members are positions in `records` (record ids are unique; slugs are not: two pairs of records share a slug).
POS = {r['id']: i for i, r in enumerate(records)}
answers = {k.split('?')[0] + '|' + json.dumps(sorted(a['params'].items()), ensure_ascii=False, separators=(',', ':')):
           {'o': [POS[x] for x in a['organizations']], 'f': [POS[x] for x in a.get('featured') or []], 't': a['total']} for k, a in SRC['answers'].items()}
data = {'captured': SRC['captured'], 'listedTotal': len(SRC['listed']), 'featuredTotal': len(SRC['featured']),
        'countries': SRC['countries'], 'industries': flatten(SRC['industriesHierarchy']), 'records': records, 'answers': answers}

if __name__ == '__main__':
    (ROOT / 'content/global-directory.json').write_text(json.dumps(content, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    (ROOT / 'assets/directory/data.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('content', len(json.dumps(content)), 'bytes; data', (ROOT / 'assets/directory/data.json').stat().st_size, 'bytes,', len(records), 'records,', len(answers), 'answers,', len(data['industries']), 'industries')
