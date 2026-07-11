import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandStorage } from "@/stores/zustandStorage";
import type { VaultId } from "@/types/domain";

interface VaultState {
  currentVaultId: VaultId | null;
  hasHydrated: boolean;
  setCurrentVaultId: (vaultId: VaultId | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      currentVaultId: null,
      hasHydrated: false,
      setCurrentVaultId: (currentVaultId) => set({ currentVaultId }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "money-vault:vault",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        currentVaultId: state.currentVaultId
      }),
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);
