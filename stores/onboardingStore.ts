import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandStorage } from "@/stores/zustandStorage";

export type OnboardingStep =
  | "welcome"
  | "vault-name"
  | "first-account"
  | "account-details"
  | "financial-cycle"
  | "savings-goal"
  | "finish";

export type OnboardingAccountKind = "Salary Account" | "Savings Account" | "Credit Card" | "Cash" | "Other";

export interface OnboardingDraft {
  accountBank: string;
  accountKind: OnboardingAccountKind | null;
  accountName: string;
  cycleStartDay: number | null;
  monthlySavingsGoal: string;
  openingBalance: string;
  vaultName: string;
}

interface VaultOnboardingState {
  completed: boolean;
  draft: OnboardingDraft;
  step: OnboardingStep;
}

interface OnboardingState {
  hasHydrated: boolean;
  vaults: Record<string, VaultOnboardingState>;
  completeVault: (vaultId: string) => void;
  resetVault: (vaultId: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setStep: (vaultId: string, step: OnboardingStep) => void;
  updateDraft: (vaultId: string, draft: Partial<OnboardingDraft>) => void;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "vault-name",
  "first-account",
  "account-details",
  "financial-cycle",
  "savings-goal",
  "finish"
];

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  accountBank: "",
  accountKind: null,
  accountName: "",
  cycleStartDay: null,
  monthlySavingsGoal: "",
  openingBalance: "",
  vaultName: ""
};

function emptyVaultState(): VaultOnboardingState {
  return {
    completed: false,
    draft: EMPTY_ONBOARDING_DRAFT,
    step: "welcome"
  };
}

function stateFor(vaults: Record<string, VaultOnboardingState>, vaultId: string) {
  const current = vaults[vaultId] ?? emptyVaultState();
  return current;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      vaults: {},
      completeVault: (vaultId) =>
        set((state) => {
          const current = stateFor(state.vaults, vaultId);
          return {
            vaults: {
              ...state.vaults,
              [vaultId]: {
                ...current,
                completed: true,
                step: "finish"
              }
            }
          };
        }),
      resetVault: (vaultId) =>
        set((state) => ({
          vaults: {
            ...state.vaults,
            [vaultId]: emptyVaultState()
          }
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setStep: (vaultId, step) =>
        set((state) => {
          const current = stateFor(state.vaults, vaultId);
          return {
            vaults: {
              ...state.vaults,
              [vaultId]: {
                ...current,
                step
              }
            }
          };
        }),
      updateDraft: (vaultId, draft) =>
        set((state) => {
          const current = stateFor(state.vaults, vaultId);
          return {
            vaults: {
              ...state.vaults,
              [vaultId]: {
                ...current,
                draft: {
                  ...current.draft,
                  ...draft
                }
              }
            }
          };
        })
    }),
    {
      name: "money-vault:onboarding",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        vaults: state.vaults
      }),
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);

export function getVaultOnboardingState(vaultId: string | null) {
  if (!vaultId) {
    return emptyVaultState();
  }

  return stateFor(useOnboardingStore.getState().vaults, vaultId);
}
