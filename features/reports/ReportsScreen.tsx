import { Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { formatCurrency } from "@/lib/format";
import { useReportsQuery } from "@/features/reports/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { JsonObject } from "@/types/domain";

function readableLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rowLabel(row: JsonObject) {
  return String(row.name ?? row.category ?? row.month ?? row.label ?? "Item");
}

function rowAmount(row: JsonObject) {
  return numberValue(row.amount) ?? numberValue(row.total) ?? numberValue(row.value) ?? 0;
}

export function ReportsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const reportsQuery = useReportsQuery(token, vaultId);
  const summaryEntries = Object.entries(reportsQuery.data?.summary ?? {}).filter(([, value]) => numberValue(value) !== null).slice(0, 6);

  return (
    <Screen>
      <ScreenHeader title="Reports" description="Cycle insights generated from the legacy Money Vault calculations." />
      {reportsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {reportsQuery.isError ? <ErrorView message="Reports could not be loaded." onRetry={() => reportsQuery.refetch()} /> : null}
      {reportsQuery.data ? (
        <View className="gap-6">
          <Section title="Summary">
            {summaryEntries.length === 0 ? (
              <EmptyState icon="chart-box-outline" title="No report totals" message="Report totals will appear once this cycle has activity." />
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {summaryEntries.map(([key, value]) => (
                  <View key={key} className="min-w-32 flex-1 gap-1 rounded-lg border border-surface-border bg-surface p-4">
                    <Text className="font-sans text-xs text-text-muted">{readableLabel(key)}</Text>
                    <Text className="font-sans text-lg font-semibold text-text">
                      {formatCurrency(numberValue(value) ?? 0, currencyCode, locale)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <ReportRows title="Category breakdown" rows={reportsQuery.data.categoryBreakdown} currencyCode={currencyCode} locale={locale} />
          <ReportRows title="Monthly trend" rows={reportsQuery.data.monthlyTrend} currencyCode={currencyCode} locale={locale} />
        </View>
      ) : null}
    </Screen>
  );
}

interface ReportRowsProps {
  currencyCode: string;
  locale: string;
  rows: JsonObject[];
  title: string;
}

function ReportRows({ currencyCode, locale, rows, title }: ReportRowsProps) {
  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <EmptyState icon="chart-donut" title="No data" message="This report section has no qualifying rows." />
      ) : (
        <View className="gap-2 rounded-lg border border-surface-border bg-surface p-2">
          {rows.slice(0, 8).map((row, index) => (
            <View key={`${rowLabel(row)}-${index}`} className="flex-row items-center justify-between gap-3 border-b border-surface-border p-3">
              <Text className="flex-1 font-sans text-sm font-semibold text-text">{rowLabel(row)}</Text>
              <Text className="font-sans text-sm text-text-muted">{formatCurrency(rowAmount(row), currencyCode, locale)}</Text>
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}
