'use client';
// Starts the CNESS Advantage motion engine (lib/advantage/engine.ts) on the server-rendered page and stops it on
// unmount. Renders nothing: the engine only sets CSS variables, classes and the field canvas, so React never
// re-renders while the page scrolls. It starts once the browser is idle (at most 400 ms after hydration), so building
// the particle field never delays the first paint or the page's first response to input.
import { useEffect } from 'react';
import { startAdvantage } from '@/lib/advantage/engine';

export default function AdvantageMotion() {
  useEffect(() => {
    let stop: (() => void) | undefined, cancelled = false;
    const start = () => { if (!cancelled) stop = startAdvantage(); };
    const idle = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(start, { timeout: 400 }) : window.setTimeout(start, 1);
    return () => { cancelled = true; if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle); clearTimeout(idle); stop?.(); };
  }, []);
  return null;
}
