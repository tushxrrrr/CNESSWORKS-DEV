// The CNESS Advantage page, read from the locked inventory (content/cness-advantage.json) in reading order.
// Same walk as tools/build-advantage.py: every item is consumed exactly once, and the build stops if the live
// structure no longer matches what the page expects (re-capture the JSON, then update this file).
import { SITE } from '@/lib/content';

export interface Item { type: string; text: string; href?: string; url?: string }
export interface Link { text: string; url: string }
export type IconName = 'chat' | 'check-list' | 'steps' | 'people' | 'bank' | 'tag' | 'beam' | 'book' | 'heart' | 'seal' | 'talk' | 'flag' | 'hands' | 'globe';

export interface Offering {
  kind: 'offering'; id: string; scene: number; hi?: number; flip: boolean; icon: IconName; emblem?: string;
  eyebrow: string; h3: string; desc: string; cta: Link;
  cols: { label: string; items: string[] }[];
  means: { label: string; text: string };
  use?: { h4: string; p: string };
}
export interface Statement { kind: 'statement'; text: string }
export interface PlanCard { name: string; summary: string; rows: { lead?: string; text: string; cap: boolean }[]; cta: Link }
export interface Plans { kind: 'plans'; h2: string; intro: string; free: PlanCard; pro: PlanCard; badge: string; noteLead: string; noteRest: string }
export interface SuperApp { kind: 'superapp'; h2: string; intro: string; ways: { title: string; text: string; icon: IconName }[]; cta: Link }
export interface Final { kind: 'final'; h2: string; p: string; primary: Link; secondary: Link }
export interface Levels { kind: 'levels'; items: (Offering | Statement)[] }   // the level rail runs through everything between Aspiring and Luminary
export interface Hero { eyebrow: string; h1: string; lede: string; start: string }
export type Block = Offering | Statement | Plans | SuperApp | Final | Levels;

// Presentation per offering, keyed by the live eyebrow text (as in the generator)
const OFF: Record<string, { id: string; scene: number; icon: IconName; flip?: boolean; hi?: number; emblem?: string }> = {
  'Trust Profile': { id: 'trust-profile', scene: 1, icon: 'chat' },
  'Organization Certification': { id: 'organization-certification', scene: 2, icon: 'check-list', flip: true },
  'Aspiring · Level One': { id: 'aspiring', scene: 3, hi: 0, icon: 'steps', emblem: 'aspiring' },
  'Inspired · Level Two': { id: 'inspired', scene: 3, hi: 1, icon: 'people', emblem: 'inspired' },
  'Luminary · Level Three': { id: 'luminary', scene: 3, hi: 2, icon: 'bank', emblem: 'luminary' },
  'Product Certification': { id: 'product-certification', scene: 4, icon: 'tag', flip: true },
  'Global Directory': { id: 'global-directory', scene: 5, icon: 'beam' },
  'Partners and Business Connections': { id: 'partners', scene: 7, icon: 'people', flip: true },
  'Best Practices and Shared Knowledge': { id: 'best-practices', scene: 8, icon: 'book' },
};
const WAYS: IconName[] = ['heart', 'seal', 'talk', 'flag', 'hands', 'globe'];
const NOTE_LEAD = 'The same certification standards for every plan.';

function read() {
  const items = SITE.main as Item[]; let pos = 0;
  const fail = (msg: string): never => { throw new Error(`CNESS Advantage inventory changed at item ${pos}: ${msg}`); };
  const peek = () => items[pos]?.type;
  const take = (type: string, text?: string): Item => {
    const it = items[pos];
    if (!it || it.type !== type || (text !== undefined && it.text !== text)) fail(`expected ${type} ${text ?? ''}, found ${it?.type} ${it?.text.slice(0, 60)}`);
    pos++; return it!;
  };
  const link = (it: Item): Link => ({ text: it.text, url: it.url ?? fail('link without url') });

  const index: { id: string; k: string; t: string }[] = [];
  const dots: { id: string; name: string }[] = [];

  const ey = take('eyebrow', 'CNESS Advantage'), h1 = take('h1'), p1 = take('p'), p2 = take('p');
  const hero: Hero = { eyebrow: ey.text, h1: h1.text, lede: p1.text, start: p2.text };
  dots.push({ id: 'advantage', name: ey.text });

  const offering = (): Offering => {
    const e = take('eyebrow'), cfg = OFF[e.text] ?? fail(`unknown offering ${e.text}`);
    const h3 = take('h3'), d = take('p'), a = take('a');
    const cols = [0, 1, 2].map(() => { const label = take('label').text; const list: string[] = []; while (peek() === 'li') list.push(take('li').text); return { label, items: list }; });
    const means = { label: take('label').text, text: take('means').text };
    const use = peek() === 'h4' ? { h4: take('h4').text, p: take('p').text } : undefined;
    index.push({ id: cfg.id, k: e.text, t: h3.text }); dots.push({ id: cfg.id, name: e.text });
    return { kind: 'offering', id: cfg.id, scene: cfg.scene, hi: cfg.hi, flip: !!cfg.flip, icon: cfg.icon, emblem: cfg.emblem, eyebrow: e.text, h3: h3.text, desc: d.text, cta: link(a), cols, means, use };
  };
  const plans = (): Plans => {
    const h = take('h2', 'Choose your Global Directory plan'), intro = take('p');
    const card = (): PlanCard => {
      const name = take('h3').text, summary = take('p').text, rows: PlanCard['rows'] = [];
      while (peek() === 'li') { const t = take('li').text, cap = t.startsWith('No '), k = t.indexOf(' — ');
        rows.push(k >= 0 ? { lead: t.slice(0, k), text: t.slice(k + 3), cap } : { text: t, cap }); }
      return { name, summary, rows, cta: link(take('a')) };
    };
    const free = card(), badge = take('badge').text, pro = card(), note = take('p').text;
    if (!note.startsWith(NOTE_LEAD + ' ')) fail('plan note changed');
    index.push({ id: 'plans', k: 'Global Directory', t: h.text }); dots.push({ id: 'plans', name: h.text });
    return { kind: 'plans', h2: h.text, intro: intro.text, free, pro, badge, noteLead: NOTE_LEAD, noteRest: note.slice(NOTE_LEAD.length + 1) };
  };
  const superapp = (): SuperApp => {
    const h = take('h2', 'Connect with people through the CNESS SuperApp'), intro = take('p'), ways: SuperApp['ways'] = [];
    while (peek() === 'h3') { const title = take('h3').text, text = take('p').text; ways.push({ title, text, icon: WAYS[ways.length] ?? fail('more than six ways') }); }
    const cta = link(take('a'));
    index.push({ id: 'superapp', k: 'CNESS SuperApp', t: h.text }); dots.push({ id: 'superapp', name: 'CNESS SuperApp' });
    return { kind: 'superapp', h2: h.text, intro: intro.text, ways, cta };
  };
  const final = (): Final => {
    const h = take('h2', 'Find your starting point'), p = take('p'), a1 = take('a'), a2 = take('a');
    index.push({ id: 'start', k: 'Analyze', t: h.text }); dots.push({ id: 'start', name: h.text });
    return { kind: 'final', h2: h.text, p: p.text, primary: link(a1), secondary: link(a2) };
  };

  const blocks: Block[] = []; let levels: Levels | null = null;
  const add = (b: Offering | Statement | Plans | SuperApp | Final) => {
    if (!levels) { blocks.push(b); return; }
    if (b.kind !== 'offering' && b.kind !== 'statement') fail(`${b.kind} inside the levels`);
    levels.items.push(b as Offering | Statement);
  };
  while (pos < items.length) {
    const it = items[pos]!;
    if (it.type === 'eyebrow') {
      if (it.text === 'Aspiring · Level One') levels = { kind: 'levels', items: [] };
      add(offering());
      if (it.text === 'Luminary · Level Three') { if (!levels) fail('levels out of order'); blocks.push(levels!); levels = null; }
    } else if (it.type === 'h2') {
      if (it.text === 'Choose your Global Directory plan') add(plans());
      else if (it.text === 'Connect with people through the CNESS SuperApp') add(superapp());
      else if (it.text === 'Find your starting point') add(final());
      else add({ kind: 'statement', text: take('h2').text });
    } else fail(`unexpected ${it.type}`);
  }
  if (levels) fail('levels not closed');
  return { hero, blocks, index, dots };
}

export const ADVANTAGE = read();
export const ADVANTAGE_URL = 'https://www.cnessworks.com/cness-advantage';
