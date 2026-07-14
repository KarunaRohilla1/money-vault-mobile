import type { DashboardViewModel } from "@/features/dashboard/types";
import type { DashboardApiResponse } from "@/services/api/types";

export function adaptDashboardResponse(response: DashboardApiResponse): DashboardViewModel {
  return {
    categories: response.data.spendingByCategory,
    creditCardDue: response.data.creditCardDue,
    cycleLabel: response.data.cycle.displayName,
    expensesThisCycle: response.data.expensesThisCycle,
    generatedAt: response.generatedAt,
    primaryAccountBalance: response.data.primaryAccount.balance,
    primaryAccountName: response.data.primaryAccount.name,
    recentActivity: response.data.recentActivity.slice(0, 5),
    remainingCommitments: response.data.remainingCommitments,
    safeToSpend: response.data.safeToSpend,
    settlement: response.data.settlement,
    vault: response.vault
  };
}
