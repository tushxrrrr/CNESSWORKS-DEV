// Copies the shared brand assets and robots.txt into public/ so Next.js serves them at the same paths
// the static pages use (assets/..., /robots.txt). assets/ at the repo root stays the single source.
import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('public', { recursive: true });
cpSync('assets', 'public/assets', { recursive: true });
cpSync('robots.txt', 'public/robots.txt');
// The Global Directory's behaviour script is shared with the static page (src/directory/app.js, one source).
cpSync('src/directory/app.js', 'public/assets/directory/app.js');
console.log('synced assets/, robots.txt and the directory script into public/');
