import { create } from "zustand";

import type { VaultSummary } from "@/types/domain";

interface CurrentVaultState {
  currentVault: VaultSummary | null;
  setCurrentVault: (vault: VaultSummary | null) => void;
}

export const useCurrentVaultStore = create<CurrentVaultState>((set) => ({
  currentVault: null,
  setCurrentVault: (currentVault) => set({ currentVault })
}));
