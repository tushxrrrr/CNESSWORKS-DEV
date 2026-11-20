import type { NextConfig } from 'next';

// Static export: `npm run build` writes plain HTML, CSS and JS to out/ (e.g. out/analyze.html), so the pages can
// still be handed over as files, and the same tests run against them as against the approved static pages.
const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
