import type { Theme } from './types';

export const THEMES: Theme[] = [
  {
    name: 'Neon Purple',
    colors: ['#7c3aed', '#c084fc', '#f0abfc'],
    background: 'rgba(6, 4, 12, 0.35)',
    glow: '#c084fc',
  },
  {
    name: 'Sunset',
    colors: ['#f97316', '#ef4444', '#fbbf24'],
    background: 'rgba(12, 5, 4, 0.35)',
    glow: '#fb923c',
  },
  {
    name: 'Cyan Green',
    colors: ['#0891b2', '#22d3ee', '#4ade80'],
    background: 'rgba(3, 10, 10, 0.35)',
    glow: '#22d3ee',
  },
  {
    name: 'Mono White',
    colors: ['#9ca3af', '#e5e7eb', '#ffffff'],
    background: 'rgba(4, 4, 6, 0.35)',
    glow: '#ffffff',
  },
];
