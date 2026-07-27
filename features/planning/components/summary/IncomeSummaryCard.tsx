import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { DetailLine, PercentageBadge, CompactSummaryCard } from "@/features/planning/components/summary/PlanningSummaryCard";
import type { PlanningTotalsApi } from "@/services/api/types";

export function IncomeSummaryCard({ accessibilityLabel, cardWidth, currencyCode, locale, percent, totals }: { accessibilityLabel: string; cardWidth: number; currencyCode: string; locale: string; percent: number; totals: PlanningTotalsApi }) {
  return (
    <CompactSummaryCard accessibilityLabel={accessibilityLabel} cardWidth={cardWidth} icon="cash" title="Income" tone="success">
      <View className="gap-0.5">
        <CurrencyText value={totals.incomeReceived} currencyCode={currencyCode} locale={locale} className="text-xl font-bold text-state-success" />
        <Text className="font-sans text-xs text-text-muted">Received</Text>
      </View>
      <DetailLine label="Planned" value={<CurrencyText value={totals.incomePlanned} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold" />} />
      <PercentageBadge percent={percent} tone="success" />
    </CompactSummaryCard>
  );
}
