import type { Metadata, Viewport } from 'next';
import './fonts/fonts.css';
import '@/src/advantage/style.css';
import { preload } from 'react-dom';
import { LIVE } from '@/lib/site';
import dmMono500 from './fonts/dm-mono-normal-500-latin.woff2';
import fraunces from './fonts/fraunces-normal-200-700-latin.woff2';
import onest from './fonts/onest-normal-300-700-latin.woff2';

// Fonts: the same Fraunces, Onest and DM Mono files the approved pages load from Google Fonts, served by the app
// itself (app/fonts, written by tools/fetch-fonts.py): no third-party request, no render-blocking cross-origin
// stylesheet, nothing sent to Google. Not next/font: the pages' size-matched fallback faces are tuned to these exact
// files and font-family names, which keeps headlines from re-wrapping when the web fonts arrive.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#060417' };

// The three faces the first screen of every page uses (headings, body text, labels; Latin subset, about 116 KB) are
// requested at once with the HTML instead of after the stylesheet: they are usually in place before first paint, so
// text does not re-wrap and move when they swap in. Imported here, so the URLs are the same fingerprinted files
// fonts.css uses (one download each). The other files (italic, other scripts) still load when text needs them.
const FIRST_SCREEN_FONTS = [fraunces, onest, dmMono500];

// metadataBase: canonical and sharing URLs resolve against the production site. Search engines stay out
// (noindex here, in every page and in robots.txt) until go-live.
export const metadata: Metadata = {
  metadataBase: new URL(LIVE),
  robots: { index: false, follow: false },
  openGraph: { siteName: 'CNESSWORKS', type: 'website' },
};

// suppressHydrationWarning on <html>: pages may add the "js" class to it before React hydrates (see app/cness-advantage).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const href of FIRST_SCREEN_FONTS) preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
