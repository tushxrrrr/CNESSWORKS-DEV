// Decorative 24px line icons used by the CNESS Advantage page (same drawings as tools/build-advantage.py).
import type { ReactNode } from 'react';
import type { IconName } from '@/lib/advantage/model';

const PATHS: Record<IconName | 'check' | 'minus' | 'scale', ReactNode> = {
  chat: <><path d="M4 5h16v10H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  'check-list': <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M8.5 12l2 2 4-4.5" /><path d="M8.5 17.5h7" /></>,
  steps: <><path d="M3 19h5v-5h5V9h5V4h3" /><circle cx="5.5" cy="10" r="1.6" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.2c2.3.2 4 1.8 4.5 4.8" /></>,
  bank: <><path d="M3 9.5L12 4l9 5.5" /><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7" /><path d="M3 20h18" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.4" /></>,
  beam: <><circle cx="12" cy="12" r="2.2" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>,
  book: <><path d="M4 5.5C6.5 4.2 9.5 4.2 12 6c2.5-1.8 5.5-1.8 8-.5V19c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5z" /><path d="M12 6v13.5" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  seal: <><circle cx="12" cy="10" r="6" /><path d="M9.5 10l1.8 1.8 3.2-3.6" /><path d="M8.5 15.2L7 21l5-2.5 5 2.5-1.5-5.8" /></>,
  talk: <><path d="M3 6h11v7H7l-4 3z" /><path d="M14 9h7v8l-3-2.4h-6V13" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2.5 4L17 12H5" /></>,
  hands: <><circle cx="12" cy="6.5" r="2.5" /><path d="M4 13c2-1 4-.6 5.5.8L12 16l2.5-2.2c1.5-1.4 3.5-1.8 5.5-.8" /><path d="M4 18h16" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5M12 3.5C9.4 5.9 8.2 8.7 8.2 12s1.2 6.1 3.8 8.5" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.6 2.6L16 9.4" /></>,
  minus: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
  scale: <><path d="M12 4v16M7 20h10" /><path d="M5 7h14" /><path d="M5 7l-2.5 6a2.8 2.8 0 0 0 5 0z" /><path d="M19 7l-2.5 6a2.8 2.8 0 0 0 5 0z" /></>,
};

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>
  );
}
