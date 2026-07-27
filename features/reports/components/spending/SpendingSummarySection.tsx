import { Text, View } from "react-native";

import type { AnalyticsSummarySectionModel } from "@/features/reports/analytics/analyticsAdapter";
import { SpendingSummaryMetricGrid } from "@/features/reports/components/spending/SpendingSummaryMetricGrid";
import type { CurrencyCode } from "@/types/domain";

interface SpendingSummarySectionProps {
  currencyCode: CurrencyCode;
  locale: string;
  summary: AnalyticsSummarySectionModel;
}

export function SpendingSummarySection({ currencyCode, locale, summary }: SpendingSummarySectionProps) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">{summary.title}</Text>
        <Text className="font-sans text-sm text-text-muted">{summary.subtitle}</Text>
      </View>
      <SpendingSummaryMetricGrid currencyCode={currencyCode} locale={locale} metrics={summary.metrics} />
    </View>
  );
}
