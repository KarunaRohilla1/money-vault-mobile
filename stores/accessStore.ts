import { create } from "zustand";

export type AppAccessState = "booting" | "signed-out" | "onboarding" | "ready";

interface AccessState {
  accessState: AppAccessState;
  setAccessState: (accessState: AppAccessState) => void;
}

export const useAccessStore = create<AccessState>((set) => ({
  accessState: "booting",
  setAccessState: (accessState) => set({ accessState })
}));
