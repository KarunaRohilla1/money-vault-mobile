import type { AuthenticatedVault, JsonObject } from "@/types/domain";
import type { CategorySpendApi, FinancialCycleApi, RecentActivityApi, SettlementApi } from "@/services/api/types";

export interface DashboardViewModel {
  categories: CategorySpendApi[];
  creditCardDue: number;
  cycle: FinancialCycleApi;
  cycleLabel: string;
  expensesThisCycle: number;
  generatedAt: string;
  primaryAccountBalance: number;
  primaryAccountName: string;
  recentActivity: RecentActivityApi[];
  remainingCommitments: number;
  safeToSpend: number;
  setup: {
    accounts: number;
    commitments: number;
    hasAccounts: boolean;
    hasCommitments: boolean;
    hasCycleSetting: boolean;
    hasIncomeTemplates: boolean;
    hasSavingsGoal: boolean;
    hasVaultLogin: boolean;
    incomeTemplates: number;
    isComplete: boolean;
  };
  settlement: SettlementApi;
  summary: JsonObject;
  vault: AuthenticatedVault;
}
