import type { NextConfig } from 'next';

// Static export: `npm run build` writes plain HTML, CSS and JS to out/ (e.g. out/analyze.html), so the pages can
// still be handed over as files, and the same tests run against them as against the approved static pages.
// NEXT_PUBLIC_BASE_PATH (e.g. "/preview") serves the app under a sub-path; lib/site.ts applies the same value to
// image paths and links. Leave it unset for the live site.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '') || undefined;

const config: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
