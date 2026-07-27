import { Text, View } from "react-native";

import { safeNumber, trendMaximumAmount } from "@/features/reports/adapter";
import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSpendingTrendPointApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

export function SpendingTrendChart({ currencyCode, locale, points }: { currencyCode: CurrencyCode; locale: string; points: ReportSpendingTrendPointApi[] }) {
  const max = trendMaximumAmount(points);
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Spending Trend</Text>
        <Text className="font-sans text-sm font-semibold text-brand-soft">View trend ›</Text>
      </View>
      {points.length === 0 ? (
        <Text className="py-8 text-center font-sans text-sm text-text-muted">No daily spending to chart.</Text>
      ) : (
        <View accessibilityLabel={`Daily spending trend. Highest day is ${formatReportValue(max, "money", currencyCode, locale)}.`} className="gap-3">
          <View className="h-36 flex-row items-end gap-1 border-b border-surface-border px-1">
            {points.map((point) => {
              const height = Math.max(2, Math.round((safeNumber(point.amount) / max) * 132));
              return <View className="min-w-0 flex-1 rounded-t-full bg-brand" key={point.date} style={{ height }} />;
            })}
          </View>
          <View className="flex-row justify-between">
            {points.filter((_point, index) => index === 0 || index === points.length - 1 || index % 5 === 0).map((point) => (
              <Text className="font-sans text-xs text-text-muted" key={point.date}>{point.label}</Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
