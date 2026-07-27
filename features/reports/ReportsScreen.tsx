import { useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { usePlanningCyclesQuery } from "@/features/planning/api";
import { CyclePickerSheet } from "@/features/planning/components/CyclePickerSheet";
import { FinancialCycleReview } from "@/features/reports/components/FinancialCycleReview";
import { OverviewSection } from "@/features/reports/components/OverviewSection";
import { ReportsHeader } from "@/features/reports/components/ReportsHeader";
import { ReportsPlaceholder, ReportsSkeleton } from "@/features/reports/components/ReportsSkeleton";
import { ReportsTabs } from "@/features/reports/components/ReportsTabs";
import { SpendingTab } from "@/features/reports/tabs/SpendingTab";
import { SharedInsightsSection } from "@/features/reports/components/SharedInsightsSection";
import { useReportsQuery } from "@/features/reports/api";
import { adjacentReportCycle, hasReportActivity, type ReportTabKey } from "@/features/reports/reportModel";
import type { PlanningCycleOptionApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

type CycleStatusFilter = "all" | "completed" | "current" | "upcoming";

function cycleYear(startDate: string) {
  const year = new Date(`${startDate}T00:00:00`).getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

export function ReportsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [cycleStart, setCycleStart] = useState<string | undefined>(undefined);
  const [cyclePickerVisible, setCyclePickerVisible] = useState(false);
  const [cyclePickerYear, setCyclePickerYear] = useState(new Date().getFullYear());
  const [cycleStatusFilter, setCycleStatusFilter] = useState<CycleStatusFilter>("all");
  const [activeTab, setActiveTab] = useState<ReportTabKey>("overview");
  const reportsQuery = useReportsQuery(token, vaultId, cycleStart);
  const report = reportsQuery.data;
  const selectedCycleStart = cycleStart ?? report?.filters.cycleStart ?? null;
  const cyclePickerQuery = usePlanningCyclesQuery(token, vaultId, cyclePickerYear, cycleStatusFilter, cyclePickerVisible);
  const fallbackCycleOptions: PlanningCycleOptionApi[] = (report?.cycleOptions ?? []).map((cycle) => ({
    endDate: cycle.endDate,
    key: cycle.key,
    label: cycle.label,
    startDate: cycle.startDate,
    status: cycle.status,
    year: cycleYear(cycle.startDate)
  }));
  const cycleOptions = cyclePickerQuery.data?.cycles ?? fallbackCycleOptions;
  const currentCycleStart = cyclePickerQuery.data?.currentCycleStart ?? fallbackCycleOptions.find((cycle) => cycle.status === "current")?.key ?? null;

  function moveCycle(direction: "next" | "previous") {
    const option = adjacentReportCycle(report?.cycleOptions ?? [], selectedCycleStart ?? "", direction);
    if (option) {
      setCycleStart(option.key);
    }
  }

  function selectCycle(nextCycleStart: string) {
    setCycleStart(nextCycleStart);
    setCyclePickerVisible(false);
  }

  function openCyclePicker() {
    setCyclePickerYear(selectedCycleStart ? cycleYear(selectedCycleStart) : new Date().getFullYear());
    setCyclePickerVisible(true);
  }

  function goToCurrentCycle() {
    if (currentCycleStart) {
      selectCycle(currentCycleStart);
    }
  }

  return (
    <Screen contentClassName="gap-5 px-4 pb-28 pt-4" onRefresh={() => reportsQuery.refetch()} refreshing={reportsQuery.isRefetching}>
      <ReportsHeader
        locale={locale}
        onNext={() => moveCycle("next")}
        onOpenPicker={openCyclePicker}
        onPrevious={() => moveCycle("previous")}
        options={report?.cycleOptions ?? []}
        selectedKey={selectedCycleStart ?? ""}
      />

      <CyclePickerSheet
        currentCycleStart={currentCycleStart}
        cycles={cycleOptions}
        loading={cyclePickerQuery.isFetching}
        selectedCycleStart={selectedCycleStart}
        selectedStatus={cycleStatusFilter}
        selectedYear={cyclePickerYear}
        visible={cyclePickerVisible}
        onClose={() => setCyclePickerVisible(false)}
        onGoToCurrent={goToCurrentCycle}
        onNextYear={() => setCyclePickerYear((year) => year + 1)}
        onPreviousYear={() => setCyclePickerYear((year) => year - 1)}
        onSelect={selectCycle}
        onStatusChange={setCycleStatusFilter}
      />

      {reportsQuery.isLoading ? <ReportsSkeleton /> : null}

      {reportsQuery.isError ? (
        <ErrorView
          message="Could not load reports. Check your connection and try again."
          onRetry={() => reportsQuery.refetch()}
          title="Reports unavailable"
        />
      ) : null}

      {report && !reportsQuery.isError ? (
        <View className="gap-5">
          <ReportsTabs active={activeTab} onChange={setActiveTab} />
          {activeTab === "overview" ? (
            <View className="gap-5">
              <OverviewSection cards={report.data.overview} currencyCode={currencyCode} locale={locale} />
              {!hasReportActivity(report.data.financialReview.totalTransactions, report.data.overview) ? (
                <EmptyState icon="chart-box-outline" title="No transactions this cycle" message="Overview values are shown as zero until activity is recorded." />
              ) : null}
              <FinancialCycleReview currencyCode={currencyCode} locale={locale} review={report.data.financialReview} />
              {report.data.financialReview.totalTransactions === 0 ? (
                <EmptyState icon="receipt-text-outline" title="No activity this cycle" message="Financial review will populate after transactions are recorded." />
              ) : null}
              <SharedInsightsSection currencyCode={currencyCode} insights={report.data.sharedInsights} locale={locale} />
            </View>
          ) : activeTab === "spending" ? (
            <SpendingTab currencyCode={currencyCode} cycleStart={selectedCycleStart} locale={locale} token={token} vaultId={vaultId} />
          ) : (
            <ReportsPlaceholder title={`${activeTab.charAt(0).toUpperCase()}${activeTab.slice(1)} reports`} />
          )}
        </View>
      ) : null}
    </Screen>
  );
}
