import { apiClient } from "@/services/api/client";
import type { OnboardingDraft } from "@/stores/onboardingStore";
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
  return Promise.resolve();
}

export async function saveFirstAccount(_token: string, _vaultId: string, _draft: OnboardingDraft): Promise<void> {
  return Promise.resolve();
}

export async function generateFirstFinancialCycle(_token: string, _vaultId: string, _cycleStartDay: number): Promise<void> {
  return Promise.resolve();
}

export async function saveMonthlySavingsGoal(_token: string, _vaultId: string, _monthlySavingsGoal: string): Promise<void> {
  return Promise.resolve();
}

export async function saveNotificationPreference(_token: string, _vaultId: string, _enabled: boolean): Promise<void> {
  return Promise.resolve();
}

export async function markOnboardingComplete(_token: string, _vaultId: string): Promise<void> {
  return Promise.resolve();
}
