import {
  EMPTY_ONBOARDING_DRAFT,
  getVaultOnboardingState,
  ONBOARDING_STEPS,
  useOnboardingStore
} from "@/stores/onboardingStore";
import {
  ensurePersonalVault,
  markOnboardingComplete,
  OnboardingApiNotImplementedError,
  saveVaultName
} from "@/services/api/onboarding";

describe("onboarding foundation", () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      hasHydrated: true,
      vaults: {}
    });
  });

  it("does not include the removed vault type step", () => {
    expect(ONBOARDING_STEPS).toEqual([
      "welcome",
      "vault-name",
      "first-account",
      "account-details",
      "financial-cycle",
      "savings-goal",
      "notifications",
      "finish"
    ]);
    expect(ONBOARDING_STEPS).not.toContain("vault-type");
  });

  it("persists only draft values and current step per vault", () => {
    useOnboardingStore.getState().updateDraft("vault-1", {
      accountName: "First account",
      vaultName: "Personal vault"
    });
    useOnboardingStore.getState().setStep("vault-1", "account-details");

    expect(getVaultOnboardingState("vault-1")).toEqual({
      draft: {
        ...EMPTY_ONBOARDING_DRAFT,
        accountName: "First account",
        vaultName: "Personal vault"
      },
      step: "account-details"
    });
  });

  it("keeps draft state scoped by vault", () => {
    useOnboardingStore.getState().updateDraft("vault-1", { vaultName: "Personal vault" });
    useOnboardingStore.getState().updateDraft("vault-2", { vaultName: "Shared vault" });

    expect(getVaultOnboardingState("vault-1").draft.vaultName).toBe("Personal vault");
    expect(getVaultOnboardingState("vault-2").draft.vaultName).toBe("Shared vault");
  });

  it("fails onboarding persistence until backend endpoints exist", async () => {
    await expect(ensurePersonalVault("token", null)).rejects.toBeInstanceOf(OnboardingApiNotImplementedError);
    await expect(saveVaultName("token", "vault-1", "Personal vault")).rejects.toBeInstanceOf(OnboardingApiNotImplementedError);
    await expect(markOnboardingComplete("token", "vault-1")).rejects.toBeInstanceOf(OnboardingApiNotImplementedError);
  });
});
