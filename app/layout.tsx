import type { Viewport } from 'next';
import '@/src/advantage/style.css';

// Fonts load from Google Fonts as on the approved pages (not next/font): the pages' size-matched fallback faces
// are tuned to these files, which keeps headlines from re-wrapping when the web fonts arrive.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,200..700;1,9..144,200..700&family=Onest:wght@300..700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
