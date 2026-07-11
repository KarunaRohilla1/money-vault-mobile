import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandStorage } from "@/stores/zustandStorage";

interface SettingsState {
  currencyCode: string;
  hasHydrated: boolean;
  locale: string;
  biometricUnlockEnabled: boolean;
  setCurrencyCode: (currencyCode: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setLocale: (locale: string) => void;
  setBiometricUnlockEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currencyCode: "INR",
      hasHydrated: false,
      locale: "en-IN",
      biometricUnlockEnabled: false,
      setCurrencyCode: (currencyCode) => set({ currencyCode }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setLocale: (locale) => set({ locale }),
      setBiometricUnlockEnabled: (biometricUnlockEnabled) => set({ biometricUnlockEnabled })
    }),
    {
      name: "money-vault:settings",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        biometricUnlockEnabled: state.biometricUnlockEnabled,
        currencyCode: state.currencyCode,
        locale: state.locale
      }),
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);
