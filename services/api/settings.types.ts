export interface VaultSummaryApi {
  id: number;
  isAdmin: boolean;
  name: string;
  vaultType: string;
}

export interface SettingsApiResponse {
  accessibleVaults: VaultSummaryApi[];
  currentVault: VaultSummaryApi;
  cycleStartDay: number;
  monthlySavingsGoal: number;
}
