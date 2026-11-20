import type { Metadata, Viewport } from 'next';
import './fonts/fonts.css';
import '@/src/advantage/style.css';
import { LIVE } from '@/lib/site';

// Fonts: the same Fraunces, Onest and DM Mono files the approved pages load from Google Fonts, served by the app
// itself (app/fonts, written by tools/fetch-fonts.py): no third-party request, no render-blocking cross-origin
// stylesheet, nothing sent to Google. Not next/font: the pages' size-matched fallback faces are tuned to these exact
// files and font-family names, which keeps headlines from re-wrapping when the web fonts arrive.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#060417' };

// metadataBase: canonical and sharing URLs resolve against the production site. Search engines stay out
// (noindex here, in every page and in robots.txt) until go-live.
export const metadata: Metadata = {
  metadataBase: new URL(LIVE),
  robots: { index: false, follow: false },
  openGraph: { siteName: 'CNESSWORKS', type: 'website' },
};

// suppressHydrationWarning on <html>: pages may add the "js" class to it before React hydrates (see app/cness-advantage).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
