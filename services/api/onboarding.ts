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

export async function ensurePersonalVault(_token: string, _vault: AuthenticatedVault | null): Promise<void> {
  throw new OnboardingApiNotImplementedError("Personal Vault provisioning");
}

export async function saveVaultName(_token: string, _vaultId: string, _vaultName: string): Promise<void> {
  throw new OnboardingApiNotImplementedError("Vault name persistence");
}

export async function saveFirstAccount(_token: string, _vaultId: string, _draft: OnboardingDraft): Promise<void> {
  throw new OnboardingApiNotImplementedError("First account persistence");
}

export async function generateFirstFinancialCycle(_token: string, _vaultId: string, _cycleStartDay: number): Promise<void> {
  throw new OnboardingApiNotImplementedError("Financial cycle generation");
}

export async function saveMonthlySavingsGoal(_token: string, _vaultId: string, _monthlySavingsGoal: string): Promise<void> {
  throw new OnboardingApiNotImplementedError("Monthly savings goal persistence");
}

export async function saveNotificationPreference(_token: string, _vaultId: string, _enabled: boolean): Promise<void> {
  throw new OnboardingApiNotImplementedError("Notification preference persistence");
}

export async function markOnboardingComplete(_token: string, _vaultId: string): Promise<void> {
  throw new OnboardingApiNotImplementedError("Onboarding completion");
}
