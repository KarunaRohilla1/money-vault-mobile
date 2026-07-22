import { useState } from "react";
import { Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { ReportCategoryBreakdown } from "@/features/reports/components/ReportCategoryBreakdown";
import { ReportDetailsAccordion } from "@/features/reports/components/ReportDetailsAccordion";
import { ReportHero } from "@/features/reports/components/ReportHero";
import { ReportPeriodSelector } from "@/features/reports/components/ReportPeriodSelector";
import { ReportTrendChart } from "@/features/reports/components/ReportTrendChart";
import { ReportsSkeleton } from "@/features/reports/components/ReportsSkeleton";
import { useReportsQuery } from "@/features/reports/api";
import { hasReportData, largestCategoryInsight, type ReportCategoryMetric } from "@/features/reports/reportModel";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function ReportsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [cycleStart, setCycleStart] = useState<string | undefined>(undefined);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [categoryMetric, setCategoryMetric] = useState<ReportCategoryMetric>("cashOutflow");
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const reportsQuery = useReportsQuery(token, vaultId, cycleStart);
  const report = reportsQuery.data;
  const shared = report?.vault.vaultType === "Shared";
  const selectedCycleStart = cycleStart ?? report?.filters.cycleStart ?? "";
  const activeMetric: ReportCategoryMetric = shared ? "householdSpending" : categoryMetric;
  const activeCategories =
    activeMetric === "netPersonalCost"
      ? report?.data.netPersonalCostByCategory ?? []
      : report?.data.cashOutflowByCategory ?? [];
  const empty = report ? !hasReportData(report.data.cashOutflowByCategory, report.data.trend) : false;
  const insight = largestCategoryInsight(activeCategories, Boolean(shared));

  return (
    <Screen contentClassName="gap-6 px-4 pb-24 pt-4" onRefresh={() => reportsQuery.refetch()} refreshing={reportsQuery.isRefetching}>
      <ReportPeriodSelector
        onClose={() => setSelectorVisible(false)}
        onOpen={() => setSelectorVisible(true)}
        onSelect={setCycleStart}
        options={report?.cycleOptions ?? []}
        selectedKey={selectedCycleStart}
        visible={selectorVisible}
      />

      {reportsQuery.isLoading ? <ReportsSkeleton /> : null}

      {reportsQuery.isError ? (
        <ErrorView
          message="Could not load reports. Check your connection and try again."
          onRetry={() => reportsQuery.refetch()}
          title="Reports unavailable"
        />
      ) : null}

      {report && !reportsQuery.isError && empty ? (
        <EmptyState icon="chart-box-outline" title="No report activity" message="The selected cycle has no reportable transactions yet." />
      ) : null}

      {report && !reportsQuery.isError && !empty ? (
        <View className="gap-6">
          <ReportHero cards={report.data.overview} currencyCode={currencyCode} locale={locale} shared={Boolean(shared)} />

          {insight ? <QuickInsight message={insight} /> : null}

          <ReportCategoryBreakdown
            cashRows={report.data.cashOutflowByCategory}
            currencyCode={currencyCode}
            locale={locale}
            metric={activeMetric}
            netRows={report.data.netPersonalCostByCategory}
            onMetricChange={setCategoryMetric}
            shared={Boolean(shared)}
          />

          <ReportTrendChart currencyCode={currencyCode} locale={locale} rows={report.data.trend} shared={Boolean(shared)} />

          <ReportDetailsAccordion
            currencyCode={currencyCode}
            expanded={detailsExpanded}
            locale={locale}
            monthlyReview={report.data.monthlyReview}
            monthlySummary={report.data.monthlySummary}
            onToggle={() => setDetailsExpanded((value) => !value)}
            sharedInsights={report.data.sharedInsights}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function QuickInsight({ message }: { message: string }) {
  return (
    <View className="rounded-xl bg-background-muted px-4 py-3">
      <Text className="font-sans text-sm text-text">{message}</Text>
    </View>
  );
}
