export const CAPACITY = 4;
export const STORAGE_KEY = 'chromasort_infinity_v1';

export interface GemTheme {
  id: number;
  name: string;
  bg: string;
  accent: string;
  path: string;
}

export const GEMS: GemTheme[] = [
  {
    id: 0,
    name: 'Ruby',
    bg: 'radial-gradient(circle at 30% 30%, #ff7b7b, #dc2626)',
    accent: '#ef4444',
    path: 'M12 2L22 12L12 22L2 12Z',
  },
  {
    id: 1,
    name: 'Sapphire',
    bg: 'radial-gradient(circle at 30% 30%, #7dd3fc, #2563eb)',
    accent: '#3b82f6',
    path: 'M12 4A8 8 0 1 0 12 20A8 8 0 1 0 12 4Z',
  },
  {
    id: 2,
    name: 'Emerald',
    bg: 'radial-gradient(circle at 30% 30%, #6ee7b7, #059669)',
    accent: '#10b981',
    path: 'M12 2L14.8 8.5L21.5 9.2L16.4 13.8L17.9 20.5L12 17L6.1 20.5L7.6 13.8L2.5 9.2L9.2 8.5Z',
  },
  {
    id: 3,
    name: 'Amber',
    bg: 'radial-gradient(circle at 30% 30%, #fde047, #d97706)',
    accent: '#f59e0b',
    path: 'M12 3L21 19H3Z',
  },
  {
    id: 4,
    name: 'Amethyst',
    bg: 'radial-gradient(circle at 30% 30%, #e879f9, #9333ea)',
    accent: '#a855f7',
    path: 'M12 2L20.5 7V17L12 22L3.5 17V7Z',
  },
  {
    id: 5,
    name: 'Cyan',
    bg: 'radial-gradient(circle at 30% 30%, #67e8f9, #0891b2)',
    accent: '#06b6d4',
    path: 'M13 2L4 14H11L10 22L20 10H13Z',
  },
  {
    id: 6,
    name: 'Rose',
    bg: 'radial-gradient(circle at 30% 30%, #fda4af, #e11d48)',
    accent: '#f43f5e',
    path: 'M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z',
  },
  {
    id: 7,
    name: 'Lime',
    bg: 'radial-gradient(circle at 30% 30%, #bef264, #65a30d)',
    accent: '#84cc16',
    path: 'M5 5H19V19H5Z',
  },
  {
    id: 8,
    name: 'Tangerine',
    bg: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c)',
    accent: '#f97316',
    path: 'M12 7A5 5 0 1 0 12 17A5 5 0 1 0 12 7M12 1V4M12 20V23M4.2 4.2L6.3 6.3M17.7 17.7L19.8 19.8M1 12H4M20 12H23M4.2 19.8L6.3 17.7M17.7 6.3L19.8 4.2',
  },
  {
    id: 9,
    name: 'Indigo',
    bg: 'radial-gradient(circle at 30% 30%, #a5b4fc, #4f46e5)',
    accent: '#6366f1',
    path: 'M15 3A9 9 0 1 0 21 15A7 7 0 1 1 15 3Z',
  },
  {
    id: 10,
    name: 'Teal',
    bg: 'radial-gradient(circle at 30% 30%, #5eead4, #0f766e)',
    accent: '#14b8a6',
    path: 'M10 3H14V10H21V14H14V21H10V14H3V10H10Z',
  },
  {
    id: 11,
    name: 'Fuchsia',
    bg: 'radial-gradient(circle at 30% 30%, #f0abfc, #c026d3)',
    accent: '#d946ef',
    path: 'M12 2C9 6 5 10 5 14A7 7 0 0 0 19 14C19 10 15 6 12 2Z',
  },
];

export interface Gem {
  c: number;
  hidden: boolean;
}

export type Tube = Gem[];

export interface MoveRecord {
  from: number;
  to: number;
  count: number;
  revealedGem: boolean;
}

export type PlayPhase = 'PLAYING' | 'LEVEL_CLEARED';

export interface PersistedGameState {
  level: number;
  score: number;
  streak: number;
  extraTubes: number;
  muted: boolean;
  symbols: boolean;
  tubes: Tube[];
  initialTubes: Tube[];
  history: MoveRecord[];
  moves: number;
  usedExtraThisLevel: boolean;
  usedUndoThisLevel: boolean;
  isMystery: boolean;
}

export interface WinSummary {
  level: number;
  moves: number;
  bonus: number;
  perfectClear: boolean;
  earnedExtraTube: boolean;
}
