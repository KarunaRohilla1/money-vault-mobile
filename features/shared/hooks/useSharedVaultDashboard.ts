import { useMemo } from "react";

import { useSharedDashboardQuery, useSharedExpensesQuery } from "@/features/shared/api";
import {
  buildMonthlyMetrics,
  buildParticipants,
  buildRecentActivity,
  buildSettlementSummary,
  type SharedActivityItem,
  type SharedMonthlyMetrics,
  type SharedParticipantViewModel,
  type SharedSettlementSummary
} from "@/features/shared/sharedDashboardModel";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CurrencyCode } from "@/types/domain";

export interface SharedVaultDashboardData {
  currencyCode: CurrencyCode;
  error: boolean;
  isRefreshing: boolean;
  loading: boolean;
  locale: string;
  monthlyMetrics: SharedMonthlyMetrics | null;
  participants: SharedParticipantViewModel[];
  quickActions: {
    canAddExpense: boolean;
    canSplit: boolean;
  } | null;
  recentActivity: SharedActivityItem[];
  refresh: () => void;
  settlementSummary: SharedSettlementSummary | null;
}

export function resolveSharedVaultId(
  explicitSharedVaultId?: number | null,
  activeVault?: { id?: string | number | null; vaultType?: string | null } | null
): number | null {
  if (explicitSharedVaultId !== undefined) {
    return explicitSharedVaultId;
  }
  if (activeVault?.vaultType === "Shared" && activeVault.id) {
    return Number(activeVault.id);
  }
  return null;
}

export function useSharedVaultDashboard(explicitSharedVaultId?: number | null): SharedVaultDashboardData {
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const sharedVaultId = resolveSharedVaultId(explicitSharedVaultId, vault);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const dashboardQuery = useSharedDashboardQuery(token, vaultId, sharedVaultId);
  const expensesQuery = useSharedExpensesQuery(token, vaultId, sharedVaultId);

  const dashboard = dashboardQuery.data?.data?.data;
  const expenses = expensesQuery.data?.data?.expenses;

  const settlementSummary = useMemo(
    () =>
      dashboard
        ? buildSettlementSummary(
            dashboard.settlement,
            dashboard.participants,
            dashboard.quickActions,
            dashboard.householdSnapshot.householdSpendThisMonth
          )
        : null,
    [dashboard]
  );
  const participants = useMemo(
    () => (dashboard ? buildParticipants(dashboard.participants, currencyCode, locale) : []),
    [currencyCode, dashboard, locale]
  );
  const monthlyMetrics = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    return buildMonthlyMetrics(dashboard);
  }, [dashboard]);
  const recentActivity = useMemo(() => buildRecentActivity(expenses, dashboard?.recentActivity, locale), [dashboard?.recentActivity, expenses, locale]);

  return {
    currencyCode,
    error: dashboardQuery.isError,
    isRefreshing: dashboardQuery.isFetching || expensesQuery.isFetching,
    loading: dashboardQuery.isLoading,
    locale,
    monthlyMetrics,
    participants,
    quickActions: dashboard
      ? {
          canAddExpense: dashboard.quickActions.canAddExpense,
          canSplit: dashboard.quickActions.canSplit
        }
      : null,
    recentActivity,
    refresh: () => {
      void dashboardQuery.refetch();
      void expensesQuery.refetch();
    },
    settlementSummary
  };
}
