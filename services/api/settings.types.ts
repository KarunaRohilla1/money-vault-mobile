export interface VaultSummaryApi {
  id: number;
  isAdmin: boolean;
  name: string;
  vaultType: string;
  role?: string;
}

export interface SettingsApiResponse {
  accessibleVaults: VaultSummaryApi[];
  currentVault: VaultSummaryApi;
  cycleStartDay: number;
  monthlySavingsGoal: number;
  showSharedBalancesOnDashboard?: boolean;
}

export interface SettingsUpdatePayloadApi {
  cycleStartDay?: number;
  monthlySavingsGoal?: number;
  pin?: string;
  showSharedBalancesOnDashboard?: boolean;
  vaultName?: string;
}
