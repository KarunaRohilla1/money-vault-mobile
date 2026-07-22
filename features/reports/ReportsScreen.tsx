import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useReportsQuery } from "@/features/reports/api";
import { formatReportValue, hasReportData, trendMaximum } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type {
  ReportCategoryItemApi,
  ReportCycleOptionApi,
  ReportMoneyCardApi,
  ReportReviewItemApi,
  ReportTrendItemApi
} from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

export function ReportsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [cycleStart, setCycleStart] = useState<string | undefined>(undefined);
  const reportsQuery = useReportsQuery(token, vaultId, cycleStart);
  const report = reportsQuery.data;

  const selectedCycleStart = cycleStart ?? report?.filters.cycleStart ?? "";
  const selectedRange = report ? `${report.filters.startDate} - ${report.filters.endDate}` : "Selected financial cycle";
  const empty = report ? !hasReportData(report.data.cashOutflowByCategory, report.data.trend) : false;
  const shared = report?.vault.vaultType === "Shared";

  return (
    <Screen onRefresh={() => reportsQuery.refetch()} refreshing={reportsQuery.isRefetching}>
      <ScreenHeader title="Reports" description={selectedRange} />

      {reportsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {reportsQuery.isError ? (
        <ErrorView
          message="Could not load reports. Check that the server is running and try again."
          onRetry={() => reportsQuery.refetch()}
          title="Reports unavailable"
        />
      ) : null}

      {report && !reportsQuery.isError ? (
        <View className="gap-5">
          <CycleSelector options={report.cycleOptions} selectedKey={selectedCycleStart} onSelect={setCycleStart} />

          {empty ? (
            <EmptyState icon="chart-box-outline" title="No report activity" message="This financial cycle has no reportable activity yet." />
          ) : null}

          <OverviewCards cards={report.data.overview} currencyCode={currencyCode} locale={locale} />

          <ReviewSection currencyCode={currencyCode} locale={locale} rows={report.data.monthlyReview} title="Financial Cycle Review" />
          <ReviewSection currencyCode={currencyCode} locale={locale} rows={report.data.monthlySummary} title="Summary" />

          <CategorySection
            currencyCode={currencyCode}
            locale={locale}
            rows={report.data.cashOutflowByCategory}
            title={shared ? "Household Spending by Category" : "Cash Outflow by Category"}
          />

          {shared ? null : (
            <CategorySection
              currencyCode={currencyCode}
              locale={locale}
              rows={report.data.netPersonalCostByCategory}
              title="Net Personal Cost by Category"
            />
          )}

          {report.data.sharedInsights.length > 0 ? (
            <ReviewSection currencyCode={currencyCode} locale={locale} rows={report.data.sharedInsights} title="Shared Insights" />
          ) : null}

          <TrendSection rows={report.data.trend} shared={shared} currencyCode={currencyCode} locale={locale} />
        </View>
      ) : null}
    </Screen>
  );
}

interface CycleSelectorProps {
  onSelect: (cycleStart: string) => void;
  options: ReportCycleOptionApi[];
  selectedKey: string;
}

function CycleSelector({ onSelect, options, selectedKey }: CycleSelectorProps) {
  return (
    <Section title="Financial Cycle">
      <View className="gap-2">
        {options.slice(-6).map((option) => {
          const selected = option.key === selectedKey;
          return (
            <Pressable
              accessibilityRole="button"
              key={option.key}
              onPress={() => onSelect(option.key)}
              className={cn(
                "rounded-lg border px-4 py-3",
                selected ? "border-brand bg-brand-deep" : "border-surface-border bg-surface"
              )}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-sans text-sm font-semibold text-text">{option.label}</Text>
                  <Text className="font-sans text-xs text-text-muted">
                    {option.startDate} - {option.endDate}
                  </Text>
                </View>
                {selected ? <MaterialCommunityIcons name="check-circle" size={theme.icons.sm} color={theme.colors.brand.soft} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

interface MoneyProps {
  currencyCode: CurrencyCode;
  locale: string;
}

function OverviewCards({ cards, currencyCode, locale }: MoneyProps & { cards: ReportMoneyCardApi[] }) {
  return (
    <Section title="Overview">
      <View className="flex-row flex-wrap gap-3">
        {cards.map((card) => (
          <View key={card.key} className="min-w-36 flex-1 gap-2 rounded-lg border border-surface-border bg-surface p-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 font-sans text-xs font-semibold uppercase text-text-muted">{card.title}</Text>
              <ToneDot tone={card.tone} />
            </View>
            <Text className="font-sans text-xl font-semibold text-text">{formatReportValue(card.value, card.format, currencyCode, locale)}</Text>
            <Text className="font-sans text-xs text-text-muted">{card.caption}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

function ToneDot({ tone }: { tone: string }) {
  const toneClass = tone === "green" ? "bg-state-success" : tone === "red" ? "bg-state-danger" : "bg-brand";
  return <View className={cn("h-2.5 w-2.5 rounded-full", toneClass)} />;
}

function ReviewSection({ currencyCode, locale, rows, title }: MoneyProps & { rows: ReportReviewItemApi[]; title: string }) {
  return (
    <Section title={title}>
      <View className="rounded-lg border border-surface-border bg-surface">
        {rows.map((row, index) => (
          <View key={row.key} className={cn("flex-row items-center justify-between gap-3 px-4 py-3", index > 0 ? "border-t border-surface-border" : "")}>
            <Text className="flex-1 font-sans text-sm text-text-muted">{row.label}</Text>
            <Text className="max-w-48 text-right font-sans text-sm font-semibold text-text">
              {formatReportValue(row.value, row.format, currencyCode, locale)}
            </Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

function CategorySection({ currencyCode, locale, rows, title }: MoneyProps & { rows: ReportCategoryItemApi[]; title: string }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <EmptyState icon="chart-donut" title="No category spending" message="No qualifying category rows for this cycle." />
      ) : (
        <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
          <Text className="font-sans text-sm text-text-muted">Total {formatReportValue(total, "money", currencyCode, locale)}</Text>
          {rows.map((row) => (
            <View key={row.key} className="gap-2">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-2">
                  <Text className="font-sans text-base">{row.icon}</Text>
                  <Text className="flex-1 font-sans text-sm font-semibold text-text">{row.name}</Text>
                </View>
                <Text className="font-sans text-sm text-text-muted">{row.percent}%</Text>
                <Text className="w-24 text-right font-sans text-sm font-semibold text-text">
                  {formatReportValue(row.amount, "money", currencyCode, locale)}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-background-muted">
                <View className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(4, Math.min(100, row.percent))}%` }} />
              </View>
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}

function TrendSection({ currencyCode, locale, rows, shared }: MoneyProps & { rows: ReportTrendItemApi[]; shared: boolean }) {
  const metric = shared ? "householdSpending" : "netPersonalCost";
  const max = useMemo(() => trendMaximum(rows, metric), [metric, rows]);

  return (
    <Section title="Financial Cycle Trends">
      {rows.length === 0 ? (
        <EmptyState icon="chart-line" title="No trend yet" message="Trend data will appear after reportable cycles exist." />
      ) : (
        <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
          {rows.map((row) => {
            const value = row[metric];
            return (
              <View key={row.cycle} className="gap-1">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 font-sans text-xs text-text-muted">{row.cycle}</Text>
                  <Text className="font-sans text-xs font-semibold text-text">{formatReportValue(value, "money", currencyCode, locale)}</Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-background-muted">
                  <View className="h-2 rounded-full bg-brand-soft" style={{ width: `${Math.max(4, Math.min(100, (value / max) * 100))}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Section>
  );
}
