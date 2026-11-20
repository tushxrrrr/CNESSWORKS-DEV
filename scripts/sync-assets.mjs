// Copies the shared brand assets and robots.txt into public/ so Next.js serves them at the same paths
// the static pages use (assets/..., /robots.txt). assets/ at the repo root stays the single source.
import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('public', { recursive: true });
cpSync('assets', 'public/assets', { recursive: true });
cpSync('robots.txt', 'public/robots.txt');
console.log('synced assets/ and robots.txt into public/');
