import type { AuthenticatedVault } from "@/types/domain";
import type { CategorySpendApi, RecentActivityApi, SettlementApi } from "@/services/api/types";

export interface DashboardViewModel {
  categories: CategorySpendApi[];
  creditCardDue: number;
  cycleLabel: string;
  expensesThisCycle: number;
  generatedAt: string;
  primaryAccountBalance: number;
  primaryAccountName: string;
  recentActivity: RecentActivityApi[];
  remainingCommitments: number;
  safeToSpend: number;
  settlement: SettlementApi;
  vault: AuthenticatedVault;
}
