'use client';
// Starts the CNESS Advantage motion engine (lib/advantage/engine.ts) on the server-rendered page and stops it on
// unmount. Renders nothing: the engine only sets CSS variables, classes and the field canvas, so React never
// re-renders while the page scrolls.
import { useEffect } from 'react';
import { startAdvantage } from '@/lib/advantage/engine';

export default function AdvantageMotion() {
  useEffect(() => startAdvantage(), []);
  return null;
}
