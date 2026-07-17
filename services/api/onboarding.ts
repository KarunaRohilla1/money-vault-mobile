import { apiClient } from "@/services/api/client";
import type { OnboardingAccountKind, OnboardingDraft } from "@/stores/onboardingStore";
import type { AuthenticatedVault } from "@/types/domain";

export interface VaultSetupStatus {
  isComplete: boolean;
}

export async function getVaultSetupStatus(token: string): Promise<VaultSetupStatus> {
  const dashboard = await apiClient.getDashboard(token);

  return {
    isComplete: dashboard.data.setup.isComplete
  };
}

export class OnboardingApiNotImplementedError extends Error {
  public constructor(operation: string) {
    super(`${operation} is not implemented by the Money Vault backend yet.`);
    this.name = "OnboardingApiNotImplementedError";
  }
}

function isPersonalVault(vault: AuthenticatedVault) {
  const normalizedType = vault.vaultType.trim().toLowerCase();
  return normalizedType === "individual" || normalizedType === "personal" || normalizedType === "personal vault";
}

export async function ensurePersonalVault(_token: string, vault: AuthenticatedVault | null): Promise<void> {
  if (vault?.id && isPersonalVault(vault)) {
    return;
  }

  if (vault?.vaultType.trim().toLowerCase() === "shared") {
    throw new Error("First-time setup must be completed from your Personal Vault.");
  }

  throw new OnboardingApiNotImplementedError("Personal Vault provisioning");
}

export async function saveVaultName(_token: string, _vaultId: string, _vaultName: string): Promise<void> {
  await apiClient.updateSettings(_token, {
    vaultName: _vaultName
  });
}

function accountTypeFor(kind: OnboardingAccountKind | null) {
  switch (kind) {
    case "Credit Card":
      return "Credit Card";
    case "Cash":
      return "Cash";
    case "Salary Account":
    case "Savings Account":
    case "Other":
    case null:
      return "Bank";
  }
}

function openingBalanceFor(value: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function saveFirstAccount(token: string, _vaultId: string, draft: OnboardingDraft): Promise<void> {
  const payload = {
    isPrimary: true,
    name: draft.accountName.trim(),
    openingBalance: openingBalanceFor(draft.openingBalance),
    type: accountTypeFor(draft.accountKind)
  };
  const accounts = await apiClient.getAccounts(token);
  const existing = accounts.find((account) => account.name.trim().toLowerCase() === payload.name.toLowerCase());

  if (existing) {
    await apiClient.updateAccount(token, existing.id, payload);
    return;
  }

  await apiClient.createAccount(token, payload);
}

export async function generateFirstFinancialCycle(token: string, _vaultId: string, cycleStartDay: number): Promise<void> {
  await apiClient.updateSettings(token, {
    cycleStartDay
  });
}

export async function saveMonthlySavingsGoal(token: string, _vaultId: string, monthlySavingsGoal: string): Promise<void> {
  if (!monthlySavingsGoal.trim()) {
    return;
  }

  await apiClient.updateSettings(token, {
    monthlySavingsGoal: Number(monthlySavingsGoal)
  });
}

export async function saveNotificationPreference(_token: string, _vaultId: string, _enabled: boolean): Promise<void> {
  return Promise.resolve();
}

export async function markOnboardingComplete(_token: string, _vaultId: string): Promise<void> {
  return Promise.resolve();
}
