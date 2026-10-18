import { create } from 'zustand';
import { setSoundMuted } from './sound';

const KEY = 'iiw-sound-muted';

/**
 * Page-sound preference. Default is MUTED on both server and first client paint
 * (so there is never a hydration mismatch); the real stored value is read in
 * `hydrate()` after mount. Persisted per-viewer in localStorage, best-effort.
 */
interface SoundState {
  muted: boolean;
  hydrated: boolean;
  hydrate: () => void;
  toggle: () => void;
}

export const useSound = create<SoundState>((set, get) => ({
  muted: true,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    let m = true;
    try {
      const v = window.localStorage.getItem(KEY);
      if (v !== null) m = v === '1';
    } catch {
      /* private mode / blocked storage: keep default */
    }
    setSoundMuted(m);
    set({ muted: m, hydrated: true });
  },
  toggle: () => {
    const next = !get().muted;
    setSoundMuted(next);
    try {
      window.localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
    set({ muted: next });
  },
}));
