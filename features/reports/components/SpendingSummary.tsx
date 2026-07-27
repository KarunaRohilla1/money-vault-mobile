import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { ReportSpendingSummaryMetricApi } from "@/services/api/types";
import { formatReportValue } from "@/features/reports/reportModel";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

const metricIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  "daily-average": "calendar-clock-outline",
  "highest-day": "fire",
  "total-spent": "receipt-text-outline",
  transactions: "format-list-bulleted"
};

export function SpendingSummary({ currencyCode, locale, metrics }: { currencyCode: CurrencyCode; locale: string; metrics: ReportSpendingSummaryMetricApi[] }) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        {metrics.map((metric) => <SpendingSummaryCard currencyCode={currencyCode} key={metric.key} locale={locale} metric={metric} />)}
      </View>
    </View>
  );
}

export function SpendingSummaryCard({ currencyCode, locale, metric }: { currencyCode: CurrencyCode; locale: string; metric: ReportSpendingSummaryMetricApi }) {
  return (
    <View className="min-w-[46%] flex-1 gap-2 rounded-xl border border-surface-border bg-surface p-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={metricIcons[metric.key] ?? "chart-box-outline"} size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <Text className="font-sans text-sm text-text-muted">{metric.title}</Text>
      <Text className="font-sans text-2xl font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatReportValue(metric.value, metric.format, currencyCode, locale)}</Text>
      <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>{metric.caption}</Text>
    </View>
  );
}
