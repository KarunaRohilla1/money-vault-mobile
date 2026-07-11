import { create } from "zustand";

export type AppAccessState = "booting" | "signed-out" | "selecting-vault" | "vault-locked" | "ready";

interface AccessState {
  accessState: AppAccessState;
  vaultUnlocked: boolean;
  setAccessState: (accessState: AppAccessState) => void;
  setVaultUnlocked: (vaultUnlocked: boolean) => void;
}

export const useAccessStore = create<AccessState>((set) => ({
  accessState: "booting",
  vaultUnlocked: false,
  setAccessState: (accessState) => set({ accessState }),
  setVaultUnlocked: (vaultUnlocked) => set({ vaultUnlocked })
}));
