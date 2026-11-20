// Font files imported from app/layout.tsx (to preload them) resolve to their fingerprinted URL.
declare module '*.woff2' {
  const src: string;
  export default src;
}
