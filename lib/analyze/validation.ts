// Field rules for the Analyze details form, matching the live page (cnessworks.com/analyze, captured 20 Nov 2026).
import { ANALYZE, type Track } from '@/lib/content';

const BAD_TLD = new Set(['example', 'test', 'invalid', 'localhost']);
const DISPOSABLE = new Set(['mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'tempmail.com', 'temp-mail.org', 'yopmail.com',
  'throwaway.email', '10minutemail.com', 'trashmail.com', 'fakeinbox.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'sharklasers.com']);

/** name@domain.tld, not on a reserved top-level domain or a listed disposable-mail domain. */
export function deliverable(value: string): boolean {
  const s = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return false;
  const domain = (s.split('@')[1] ?? '').toLowerCase(), tld = domain.split('.').pop() ?? '';
  return !(BAD_TLD.has(tld) || DISPOSABLE.has(domain));
}

function hostOk(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/\.$/, '');
  if (!h || h.includes('..') || h.includes(' ') || !h.includes('.') || h === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
  const parts = h.split('.');
  return parts.length >= 2 && /^[a-z]{2,24}$/i.test(parts[parts.length - 1] ?? '') && parts.every(p => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(p));
}

/** An http(s) URL with a real host name and no credentials. */
export function urlOk(value: string): boolean {
  const a = value.trim();
  if (!a || !/^https?:\/\//i.test(a)) return false;
  try {
    const u = new URL(a);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password && hostOk(u.hostname);
  } catch { return false; }
}

export type FormValues = Record<string, string>;
const v = (f: FormValues, k: string) => f[k] ?? '';

/** Invalid field keys, in the live page's order (the first one gets focus). */
export function problems(track: Track, f: FormValues): string[] {
  const p: string[] = [];
  if (track === 'organization') {
    if (!v(f, 'org_name').trim()) p.push('org_name');
    if (v(f, 'website').trim() && !urlOk(v(f, 'website'))) p.push('website');
    if (!deliverable(v(f, 'email'))) p.push('email');
  } else {
    if (!v(f, 'org_name').trim()) p.push('org_name');
    if (!v(f, 'product_name').trim()) p.push('product_name');
    if (!urlOk(v(f, 'website'))) p.push('website');
    if (!v(f, 'product_description').trim()) p.push('product_description');
    if (!deliverable(v(f, 'email'))) p.push('email');
  }
  return p;
}

/** The live page's message for a failed submit. */
export function message(list: string[], f: FormValues): string | null {
  const V = ANALYZE.validation, first = list[0];
  if (!list.length) return null;
  if (list.length > 1) return V.all;
  if (first === 'email') return V.email;
  if (first === 'org_name') return V.orgName;
  if (first === 'website') return v(f, 'website').trim() ? V.websiteInvalid : V.websiteRequired;
  if (first === 'product_name' || first === 'product_description') return V.productFields;
  return v(f, 'email').trim() ? V.email : V.all;
}
