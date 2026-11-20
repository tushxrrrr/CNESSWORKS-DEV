// Locked content, imported from the same JSON inventories the static pages and verifiers use (content/*.json).
// Never edit the copy here: re-capture the JSON from the live site when the live text changes.
import site from '@/content/cness-advantage.json';
import analyze from '@/content/analyze.json';
import graphic from '@/lib/analyze/graphic.json';

export const SITE = site;
export const ANALYZE = analyze;
export const GRAPHIC = graphic;

export type Track = 'organization' | 'product';
export const TRACKS: readonly Track[] = ['organization', 'product'];

export interface Field {
  key: string;
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'textarea' | 'select' | 'email';
  options?: 'categories' | 'countries';
  empty?: string;
}
export interface Pillar { name: string; summary: string; paragraphs: string[] }

export const trackContent = (t: Track) => ANALYZE.tracks[t];
export const trackFields = (t: Track) => ANALYZE.tracks[t].form.fields as Field[];
export const trackPillars = (t: Track) => ANALYZE.tracks[t].pillars as Pillar[];
