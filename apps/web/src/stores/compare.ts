import { create } from "zustand";

const MAX = 3;

type CompareState = {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
};

/** Client-only UI state: listings the buyer is comparing side by side. */
export const useCompare = create<CompareState>((set) => ({
  ids: [],
  toggle: (id) =>
    set((s) => ({
      ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id].slice(-MAX),
    })),
  clear: () => set({ ids: [] }),
}));
