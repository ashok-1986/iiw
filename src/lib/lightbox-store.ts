import { create } from 'zustand';

export interface LightboxItem {
  src: string;
  name: string;
  org?: string;
}

interface LightboxState {
  item: LightboxItem | null;
  open: (item: LightboxItem) => void;
  close: () => void;
}

export const useLightbox = create<LightboxState>((set) => ({
  item: null,
  open: (item) => set({ item }),
  close: () => set({ item: null }),
}));
