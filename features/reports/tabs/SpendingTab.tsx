import { useState } from "react";
import { Text, View } from "react-native";

import { ErrorView } from "@/components/ui/ErrorView";
import { useReportsAnalytics } from "@/features/reports/analytics/AnalysisContext";
import { AnalysisProvider } from "@/features/reports/analytics/AnalysisProvider";
import { adaptSpendingAnalytics, hasAnalyticsData, selectedChartItem } from "@/features/reports/analytics/analyticsAdapter";
import { useSpendingAnalyticsQuery } from "@/features/reports/analytics/api";
import { FilterSheet } from "@/features/reports/analytics/components/FilterSheet";
import { TrendSection, BreakdownSection } from "@/features/reports/analytics/components/TrendSection";
import { VisualizationSection } from "@/features/reports/analytics/components/VisualizationSection";
import { SpendingActiveFilterSummary } from "@/features/reports/components/spending/SpendingActiveFilterSummary";
import { SpendingDimensionSelector } from "@/features/reports/components/spending/SpendingDimensionSelector";
import { SpendingFilterButton } from "@/features/reports/components/spending/SpendingFilterButton";
import { SpendingSpendComparisonSection } from "@/features/reports/components/spending/SpendingSpendComparisonSection";
import { SpendingSummarySection } from "@/features/reports/components/spending/SpendingSummarySection";
import type { CurrencyCode } from "@/types/domain";

interface SpendingTabProps {
  currencyCode: CurrencyCode;
  cycleStart: string | null;
  locale: string;
  token: string | null;
  vaultId: string | null;
}

export function SpendingTab(props: SpendingTabProps) {
  return (
    <AnalysisProvider selectedCycle={props.cycleStart}>
      <SpendingAnalyticsWorkspace {...props} />
    </AnalysisProvider>
  );
}

function SpendingAnalyticsWorkspace({ currencyCode, locale, token, vaultId }: SpendingTabProps) {
  const { clearFilters, setAnalysisDimension, setFilters, state } = useReportsAnalytics();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const query = useSpendingAnalyticsQuery(token, vaultId, state);
  const model = adaptSpendingAnalytics(query.data);
  const selected = selectedChartItem(model?.chart.items ?? [], selectedKey);

  function changeDimension(nextDimension: typeof state.analysisDimension) {
    setSelectedKey(null);
    setAnalysisDimension(nextDimension);
  }

  if (query.isPending && !query.data) {
    return <SpendingSkeleton />;
  }

  if (query.isError) {
    return <ErrorView title="Spending report unavailable" message="Could not load spending details. Check your connection and try again." onRetry={() => query.refetch()} />;
  }

  if (!hasAnalyticsData(model)) {
    return (
      <View className="gap-4 rounded-xl border border-surface-border bg-surface p-6">
        <Text className="text-center font-sans text-lg font-bold text-text">{model?.empty.title ?? "No spending"}</Text>
        <Text className="text-center font-sans text-sm text-text-muted">{model?.empty.message ?? "No spending for this cycle."}</Text>
      </View>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <View className="gap-5">
      <View className="gap-3">
        <SpendingDimensionSelector active={state.analysisDimension} onSelect={changeDimension} />
        <SpendingFilterButton filters={state.filters} onPress={() => setFiltersVisible(true)} />
        <SpendingActiveFilterSummary filters={state.filters} onClear={clearFilters} />
      </View>
      <SpendingSummarySection currencyCode={currencyCode} locale={locale} summary={model.summarySection} />
      <SpendingSpendComparisonSection comparison={model.spendComparison} currencyCode={currencyCode} locale={locale} />
      <VisualizationSection currencyCode={currencyCode} items={model.chart.items} locale={locale} onSelect={setSelectedKey} selectedKey={selected?.key ?? null} title={model.chart.title} total={model.chart.total} type={model.chart.type} />
      <TrendSection currencyCode={currencyCode} locale={locale} points={model.trend.points} title={model.trend.title} />
      <BreakdownSection currencyCode={currencyCode} locale={locale} onSelect={setSelectedKey} rows={model.breakdown.rows} title={model.breakdown.title} />
      <FilterSheet filters={state.filters} onApply={setFilters} onClear={clearFilters} onClose={() => setFiltersVisible(false)} options={model.filterOptions} visible={filtersVisible} />
    </View>
  );
}

function SpendingSkeleton() {
  return <View className="gap-4">{[0, 1, 2, 3].map((item) => <View className="h-40 rounded-xl bg-surface" key={item} />)}</View>;
}
