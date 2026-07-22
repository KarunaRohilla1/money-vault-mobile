import { Text, View } from "react-native";

import {
  cycleComparison,
  formatReportValue,
  reportNumber,
  shortCycleLabel,
  trendMaximum,
  trendMetricForVault,
  trendMetricLabel
} from "@/features/reports/reportModel";
import type { ReportTrendItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface ReportTrendChartProps {
  currencyCode: CurrencyCode;
  locale: string;
  rows: ReportTrendItemApi[];
  shared: boolean;
}

export function ReportTrendChart({ currencyCode, locale, rows, shared }: ReportTrendChartProps) {
  const metric = trendMetricForVault(shared);
  const max = trendMaximum(rows, metric);
  const comparison = cycleComparison(rows, metric, currencyCode, locale);
  const chartHeight = 112;

  if (rows.length === 0) {
    return null;
  }

  return (
    <View className="gap-4">
      <View>
        <Text className="font-sans text-lg font-semibold text-text">Cycle comparison</Text>
        <Text className="font-sans text-sm text-text-muted">{trendMetricLabel(metric)} across recent cycles</Text>
      </View>

      <View className="gap-4 rounded-xl bg-surface p-4">
        <View className="h-36 flex-row items-end justify-between gap-2">
          {rows.slice(-6).map((row, index, visibleRows) => {
            const value = reportNumber(row[metric]);
            const height = Math.max(8, Math.min(chartHeight, (value / max) * chartHeight));
            const current = index === visibleRows.length - 1;
            const cycleLabel = shortCycleLabel(row.cycle);
            return (
              <View key={`${cycleLabel}-${index}`} className="min-w-0 flex-1 items-center gap-2">
                <View className="h-28 w-full justify-end rounded-full bg-background-muted px-1.5">
                  <View className={current ? "rounded-full bg-brand" : "rounded-full bg-surface-pressed"} style={{ height }} />
                </View>
                <Text className="font-sans text-[10px] text-text-muted" numberOfLines={1}>
                  {cycleLabel || "Cycle"}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-sans text-xs text-text-muted">
            {comparison ?? "Comparison will appear when the previous cycle has reportable activity."}
          </Text>
          <Text className="font-sans text-sm font-semibold text-text" adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1}>
            {formatReportValue(reportNumber(rows[rows.length - 1]?.[metric]), "money", currencyCode, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}
