import { create } from "zustand";

interface SettingsState {
  currencyCode: string;
  locale: string;
  biometricUnlockEnabled: boolean;
  setCurrencyCode: (currencyCode: string) => void;
  setLocale: (locale: string) => void;
  setBiometricUnlockEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currencyCode: "USD",
  locale: "en-US",
  biometricUnlockEnabled: false,
  setCurrencyCode: (currencyCode) => set({ currencyCode }),
  setLocale: (locale) => set({ locale }),
  setBiometricUnlockEnabled: (biometricUnlockEnabled) => set({ biometricUnlockEnabled })
}));
