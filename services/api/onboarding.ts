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

export async function ensurePersonalVault(_token: string, _vault: AuthenticatedVault | null): Promise<void> {
  await Promise.resolve();
}

export async function saveVaultName(_token: string, _vaultId: string, _vaultName: string): Promise<void> {
  await Promise.resolve();
}

export async function saveFirstAccount(_token: string, _vaultId: string, _draft: OnboardingDraft): Promise<void> {
  await Promise.resolve();
}

export async function generateFirstFinancialCycle(_token: string, _vaultId: string, _cycleStartDay: number): Promise<void> {
  await Promise.resolve();
}

export async function saveMonthlySavingsGoal(_token: string, _vaultId: string, _monthlySavingsGoal: string): Promise<void> {
  await Promise.resolve();
}

export async function saveNotificationPreference(_token: string, _vaultId: string, _enabled: boolean): Promise<void> {
  await Promise.resolve();
}

export async function markOnboardingComplete(_token: string, _vaultId: string): Promise<void> {
  await Promise.resolve();
}
