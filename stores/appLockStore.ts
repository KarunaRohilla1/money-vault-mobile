import { create } from "zustand";

interface AppLockState {
  locked: boolean;
  setLocked: (locked: boolean) => void;
}

export const useAppLockStore = create<AppLockState>((set) => ({
  locked: false,
  setLocked: (locked) => set({ locked })
}));
