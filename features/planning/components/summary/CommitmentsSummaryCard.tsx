import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { DetailLine, PercentageBadge, CompactSummaryCard } from "@/features/planning/components/summary/PlanningSummaryCard";
import type { PlanningTotalsApi } from "@/services/api/types";

export function CommitmentsSummaryCard({ accessibilityLabel, cardWidth, currencyCode, locale, percent, totals }: { accessibilityLabel: string; cardWidth: number; currencyCode: string; locale: string; percent: number; totals: PlanningTotalsApi }) {
  return (
    <CompactSummaryCard accessibilityLabel={accessibilityLabel} cardWidth={cardWidth} icon="calendar-check-outline" title="Commitments" tone="warning">
      <View className="gap-0.5">
        <CurrencyText value={totals.commitmentsCompleted} currencyCode={currencyCode} locale={locale} className="text-xl font-bold text-text" />
        <Text className="font-sans text-xs text-text-muted">Paid</Text>
      </View>
      <View className="gap-1">
        <DetailLine label="Remaining" value={<CurrencyText value={totals.remainingCommitments} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold text-accent-gold" />} />
        <DetailLine label="Planned" value={<CurrencyText value={totals.commitmentsPlanned} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold" />} />
      </View>
      <PercentageBadge percent={percent} tone="warning" />
    </CompactSummaryCard>
  );
}
