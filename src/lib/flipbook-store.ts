import { create } from 'zustand';
import { slugify, type Nominee } from './nominee';

/**
 * Flipbook state (PRD: Zustand owns currentPage + searchQ).
 * `spread` is the desktop two-page view: 2 profiles per page, 4 per spread.
 */
export interface FlipProfile {
  id: string;
  name: string;
  summary: string;
  fullText: string;
  org: string;
  imageId: string | null;
  image: string | null;
  category: string;
  slug: string;
  compiled?: boolean;
}

/**
 * Project an internal Nominee onto the client-safe flipbook shape.
 * PII guardrail: curator notes (`dueDiligence`), provenance and consent flags stay
 * server-side. Pass nominees through this before any 'use client' boundary.
 */
export function toFlipProfile(n: Nominee): FlipProfile {
  return {
    id: n.id,
    name: n.name,
    summary: n.summary,
    fullText: n.fullText,
    org: n.organization,
    imageId: n.imageId,
    image: n.image,
    category: n.category,
    slug: slugify(n.name, n.id),
    compiled: Boolean(n.compiled),
  };
}

interface FlipbookState {
  spread: number;
  totalSpreads: number;
  direction: 1 | -1 | 0;
  query: string;
  category: string | null;
  setTotalSpreads: (n: number) => void;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  setQuery: (q: string) => void;
  setCategory: (c: string | null) => void;
  reset: () => void;
}

export const useFlipbook = create<FlipbookState>((set) => ({
  spread: 0,
  totalSpreads: 1,
  direction: 0,
  query: '',
  category: null,
  setTotalSpreads: (n) => set({ totalSpreads: Math.max(1, n), spread: 0 }),
  go: (i) =>
    set((s) => {
      const target = Math.max(0, Math.min(i, s.totalSpreads - 1));
      return { direction: target > s.spread ? 1 : -1, spread: target };
    }),
  next: () =>
    set((s) => {
      if (s.spread >= s.totalSpreads - 1) return s;
      return { direction: 1, spread: s.spread + 1 };
    }),
  prev: () =>
    set((s) => {
      if (s.spread <= 0) return s;
      return { direction: -1, spread: s.spread - 1 };
    }),
  setQuery: (q) => set({ query: q }),
  setCategory: (c) => set({ category: c }),
  reset: () => set({ spread: 0, direction: 0 }),
}));
