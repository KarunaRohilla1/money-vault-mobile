import { View, useWindowDimensions } from "react-native";

import type { SpendingSummaryMetricViewModel } from "@/features/reports/analytics/analyticsAdapter";
import { SpendingSummaryMetricCard } from "@/features/reports/components/spending/SpendingSummaryMetricCard";
import type { CurrencyCode } from "@/types/domain";

interface SpendingSummaryMetricGridProps {
  currencyCode: CurrencyCode;
  locale: string;
  metrics: SpendingSummaryMetricViewModel[];
}

export function SpendingSummaryMetricGrid({ currencyCode, locale, metrics }: SpendingSummaryMetricGridProps) {
  const { fontScale, width } = useWindowDimensions();
  const oneColumn = width < 350 || fontScale > 1.25;
  const fourColumns = width >= 760 && fontScale <= 1.1;
  const basisClass = oneColumn ? "basis-full" : fourColumns ? "basis-[23%]" : "basis-[47%]";
  return (
    <View className="flex-row flex-wrap gap-3" testID="spending-summary-metric-grid">
      {metrics.map((metric) => <SpendingSummaryMetricCard basisClass={basisClass} currencyCode={currencyCode} key={metric.id} locale={locale} metric={metric} />)}
    </View>
  );
}
