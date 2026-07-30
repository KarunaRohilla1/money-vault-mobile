import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatAnalyticsDateLabel, type SpendingSummaryMetricViewModel } from "@/features/reports/analytics/analyticsAdapter";
import { formatReportValue, reportSummaryCaption } from "@/features/reports/reportModel";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SpendingSummaryMetricCardProps {
  basisClass: string;
  currencyCode: CurrencyCode;
  locale: string;
  metric: SpendingSummaryMetricViewModel;
}

export function SpendingSummaryMetricCard({ basisClass, currencyCode, locale, metric }: SpendingSummaryMetricCardProps) {
  const value = formatReportValue(metric.value, metric.format, currencyCode, locale);
  const supportText = reportSummaryCaption(metric.supportingText);
  const support = formatAnalyticsDateLabel(supportText, locale) ?? supportText;
  const accessibilityLabel = [metric.label, value, support].filter(Boolean).join(", ");
  return (
    <View accessibilityLabel={accessibilityLabel} className={`${basisClass} min-h-28 flex-1 gap-2 rounded-xl border border-surface-border bg-surface px-3 py-3`}>
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons name={metric.iconName} size={theme.icons.xs} color={theme.colors.brand.soft} />
        </View>
        <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={2}>{metric.label}</Text>
      </View>
      <Text className="font-sans text-2xl font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{value}</Text>
      {support ? <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>{support}</Text> : null}
    </View>
  );
}
