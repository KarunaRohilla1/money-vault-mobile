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
}

export interface SettingsUpdatePayloadApi {
  cycleStartDay?: number;
  monthlySavingsGoal?: number;
  pin?: string;
  vaultName?: string;
}
