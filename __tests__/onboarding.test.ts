import {
  EMPTY_ONBOARDING_DRAFT,
  getVaultOnboardingState,
  ONBOARDING_STEPS,
  useOnboardingStore
} from "@/stores/onboardingStore";
import { apiClient } from "@/services/api/client";
import {
  ensurePersonalVault,
  generateFirstFinancialCycle,
  markOnboardingComplete,
  OnboardingApiNotImplementedError,
  saveFirstAccount,
  saveMonthlySavingsGoal,
  saveVaultName
} from "@/services/api/onboarding";

describe("onboarding foundation", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
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
      completed: false,
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

  it("keeps Personal Vault provisioning guarded when no backend vault exists", async () => {
    await expect(ensurePersonalVault("token", null)).rejects.toBeInstanceOf(OnboardingApiNotImplementedError);
  });

  it("persists vault name, cycle, and savings goal through backend settings", async () => {
    const updateSettings = jest.spyOn(apiClient, "updateSettings").mockResolvedValue({
      accessibleVaults: [],
      currentVault: {
        id: 1,
        isAdmin: true,
        name: "Personal vault",
        vaultType: "Individual"
      },
      cycleStartDay: 10,
      monthlySavingsGoal: 1000
    });

    await expect(saveVaultName("token", "vault-1", "Personal vault")).resolves.toBeUndefined();
    await expect(generateFirstFinancialCycle("token", "vault-1", 10)).resolves.toBeUndefined();
    await expect(saveMonthlySavingsGoal("token", "vault-1", "1000")).resolves.toBeUndefined();
    await expect(markOnboardingComplete("token", "vault-1")).resolves.toBeUndefined();

    expect(updateSettings).toHaveBeenCalledWith("token", { vaultName: "Personal vault" });
    expect(updateSettings).toHaveBeenCalledWith("token", { cycleStartDay: 10 });
    expect(updateSettings).toHaveBeenCalledWith("token", { monthlySavingsGoal: 1000 });
  });

  it("creates the first account through the backend", async () => {
    jest.spyOn(apiClient, "getAccounts").mockResolvedValue([]);
    const createAccount = jest.spyOn(apiClient, "createAccount").mockResolvedValue({ status: "ok" });

    await expect(
      saveFirstAccount("token", "vault-1", {
        ...EMPTY_ONBOARDING_DRAFT,
        accountKind: "Salary Account",
        accountName: "Salary Account",
        openingBalance: "500"
      })
    ).resolves.toBeUndefined();

    expect(createAccount).toHaveBeenCalledWith("token", {
      isPrimary: true,
      name: "Salary Account",
      openingBalance: 500,
      type: "Bank"
    });
  });

  it("updates an existing first account instead of duplicating it", async () => {
    jest.spyOn(apiClient, "getAccounts").mockResolvedValue([
      {
        id: 7,
        isPrimary: true,
        name: "Salary Account",
        openingBalance: 100,
        type: "Bank"
      }
    ]);
    const updateAccount = jest.spyOn(apiClient, "updateAccount").mockResolvedValue({
      id: 7,
      isPrimary: true,
      name: "Salary Account",
      openingBalance: 500,
      type: "Bank"
    });

    await saveFirstAccount("token", "vault-1", {
      ...EMPTY_ONBOARDING_DRAFT,
      accountKind: "Salary Account",
      accountName: "Salary Account",
      openingBalance: "500"
    });

    expect(updateAccount).toHaveBeenCalledWith("token", 7, {
      isPrimary: true,
      name: "Salary Account",
      openingBalance: 500,
      type: "Bank"
    });
  });

  it("records local mobile onboarding completion per vault", () => {
    useOnboardingStore.getState().completeVault("vault-1");

    expect(getVaultOnboardingState("vault-1")).toEqual({
      completed: true,
      draft: EMPTY_ONBOARDING_DRAFT,
      step: "finish"
    });
  });

  it("treats the authenticated Personal Vault as already provisioned", async () => {
    await expect(
      ensurePersonalVault("token", {
        id: "vault-1",
        isAdmin: true,
        name: "Personal vault",
        vaultType: "Individual"
      })
    ).resolves.toBeUndefined();
  });

  it("does not allow first-time setup to run against a Shared Vault", async () => {
    await expect(
      ensurePersonalVault("token", {
        id: "shared-1",
        isAdmin: false,
        name: "Shared vault",
        vaultType: "Shared"
      })
    ).rejects.toThrow("First-time setup must be completed from your Personal Vault.");
  });
});
