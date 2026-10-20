import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { EmptyState, ErrorView } from "@/components/ui";
import { hasOutstandingSettlement } from "@/features/dashboard/settlement";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import { SharedActivityList } from "@/features/shared/components/SharedActivityList";
import { SharedDashboardHeader, SharedSectionHeader } from "@/features/shared/components/SharedDashboardHeader";
import { SharedDashboardSkeleton } from "@/features/shared/components/SharedDashboardSkeleton";
import { SharedMetricsRow } from "@/features/shared/components/SharedMetricCard";
import { ParticipantsCard, ParticipantsSection } from "@/features/shared/components/ParticipantRow";
import { SettlementHistorySection } from "@/features/settlements/components/SettlementHistorySection";
import { SettlementSheet } from "@/features/shared/components/SettlementSheet";
import { SharedSettlementHero } from "@/features/shared/components/SharedSettlementHero";
import { useSettlementSheet } from "@/features/shared/hooks/useSettlementSheet";
import { useSharedVaultDashboard } from "@/features/shared/hooks/useSharedVaultDashboard";
import { sharedRoutes } from "@/features/shared/routes";
import { useAuthStore } from "@/stores/authStore";
import type { CurrencyCode } from "@/types/domain";

export function SharedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sharedVaultId?: string }>();
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const routeSharedVaultId =
    params.sharedVaultId && Number.isFinite(Number(params.sharedVaultId)) ? Number(params.sharedVaultId) : null;
  const sharedVaultId = routeSharedVaultId ?? (vault?.vaultType === "Shared" && vaultId ? Number(vaultId) : null);
  const dashboard = useSharedVaultDashboard(sharedVaultId);
  const shouldLoadSettlementDetails =
    Boolean(dashboard.settlementSummary) &&
    hasOutstandingSettlement({
      amount: dashboard.settlementSummary?.outstandingBalance ?? 0,
      direction: dashboard.settlementSummary?.settlementState === "settled" ? "settled" : dashboard.settlementSummary?.settlementState ?? "settled"
    });
  const settlement = useSettlementSheet({
    currencyCode: dashboard.currencyCode as CurrencyCode,
    enabled: shouldLoadSettlementDetails,
    locale: dashboard.locale,
    sharedVaultId,
    token,
    vaultId
  });

  if (dashboard.loading) {
    return <SharedDashboardSkeleton />;
  }

  if (dashboard.error || !dashboard.settlementSummary || !dashboard.monthlyMetrics) {
    return (
      <Screen>
        <SharedDashboardHeader />
        <ErrorView message="Couldn't load your shared dashboard. Check that the server is running and try again." onRetry={dashboard.refresh} />
      </Screen>
    );
  }

  const openSharedTransactions = () => {
    router.push(sharedRoutes.transactions as never);
  };

  const openSettlementHistory = () => {
    router.push(sharedRoutes.settlementHistory as never);
  };

  return (
    <>
      <Screen contentClassName={dashboardLayout.bottomClearanceClassName} onRefresh={dashboard.refresh} refreshing={dashboard.isRefreshing}>
        <SharedDashboardHeader />

        <SharedSettlementHero
          currencyCode={dashboard.currencyCode}
          isSettling={settlement.isSettling}
          locale={dashboard.locale}
          onMarkSettled={settlement.openSettlementSheet}
          summary={dashboard.settlementSummary}
        />

        <View className={dashboardLayout.sectionGapClassName}>
          <SharedSectionHeader actionLabel="View All" onActionPress={openSharedTransactions} title="Recent Activity" />
          {dashboard.recentActivity.length === 0 ? (
            <EmptyState icon="history" title="No shared expenses yet" message="Shared expenses for this cycle will appear here." />
          ) : (
            <SharedActivityList currencyCode={dashboard.currencyCode} items={dashboard.recentActivity} locale={dashboard.locale} />
          )}
        </View>

        <View className={dashboardLayout.sectionGapClassName}>
          <SharedSectionHeader title="Participants" />
          {dashboard.participants.length === 0 ? (
            <EmptyState icon="account-group-outline" title="No participants yet" message="Connected shared-vault participants will appear here." />
          ) : (
            <ParticipantsCard>
              <ParticipantsSection
                currencyCode={dashboard.currencyCode}
                locale={dashboard.locale}
                participants={dashboard.participants}
              />
            </ParticipantsCard>
          )}
        </View>

        <View className={dashboardLayout.sectionGapClassName}>
          <SharedSectionHeader title="This Month" />
          <SharedMetricsRow currencyCode={dashboard.currencyCode} locale={dashboard.locale} metrics={dashboard.monthlyMetrics} />
        </View>

        <View className={dashboardLayout.sectionGapClassName}>
          <SharedSectionHeader actionLabel="View All" onActionPress={openSettlementHistory} title="Settlement History" />
          <SettlementHistorySection currencyCode={dashboard.currencyCode} locale={dashboard.locale} sharedVaultId={sharedVaultId} />
        </View>
      </Screen>
      <SettlementSheet {...settlement.settlementSheetProps} />
    </>
  );
}
