// Deployment settings shared by every page.
//
// BASE_PATH: set NEXT_PUBLIC_BASE_PATH (e.g. "/preview") to serve the app under a sub-path; next.config.ts passes
// the same value to Next.js. Empty for the live site.
// APP_PAGES: the live pages this app serves. Links to them stay inside the app (same tab, local path) and keep the
// production URL in data-prod-href; every other cnessworks.com link still goes to the live site.
export const LIVE = 'https://www.cnessworks.com';
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

/** Root-relative URL for a file in assets/ (or any public file). Works at /page, /page/ and under BASE_PATH. */
export const asset = (p: string) => `${BASE_PATH}/${p.replace(/^\/+/, '')}`;

export const APP_PAGES: Record<string, string> = Object.fromEntries(
  ['cness-advantage', 'analyze', 'mother-of-certification', 'cness-certification', 'product-certification', 'globaldirectory'].map(r => [`${LIVE}/${r}`, r]),
);
/** Local path for a production URL this app serves, or null for links that stay on the live site. */
export const appPath = (url: string | undefined) => {
  const r = url ? APP_PAGES[url.split(/[?#]/)[0]!] : undefined;
  return r ? `${BASE_PATH}/${r}${url!.slice(url!.split(/[?#]/)[0]!.length)}` : null;
};

/** Page metadata: title, description, canonical production URL and sharing card. Search engines stay out until
 *  go-live (noindex; see README "Going live"). */
export function pageMetadata(route: string, title: string, description: string) {
  return {
    title, description,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${route}` },
    openGraph: { title, description, url: `/${route}`, siteName: 'CNESSWORKS', type: 'website' as const },
    twitter: { card: 'summary' as const, title, description },
  };
}
