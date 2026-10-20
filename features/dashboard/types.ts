import type { AuthenticatedVault, JsonObject } from "@/types/domain";
import type {
  CategorySpendApi,
  FinancialCycleApi,
  RecentActivityApi,
  SafeToSpendBreakdownApi,
  SettlementApi,
  SharedVaultBalanceCardApi
} from "@/services/api/types";

export interface DashboardViewModel {
  categories: CategorySpendApi[];
  creditCardDue: number;
  cycle: FinancialCycleApi;
  cycleLabel: string;
  expensesThisCycle: number;
  generatedAt: string;
  netSavingsThisCycle?: number;
  actualSavings?: number;
  savingsGoalRemaining?: number;
  primaryAccountBalance: number;
  primaryAccountName: string;
  recentActivity: RecentActivityApi[];
  remainingCommitments: number;
  safeToSpend: number;
  safeToSpendBreakdown: SafeToSpendBreakdownApi | null;
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
  sharedVaultBalances: SharedVaultBalanceCardApi[];
  showSharedBalancesOnDashboard: boolean;
  summary: JsonObject;
  vault: AuthenticatedVault;
}
