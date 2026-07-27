import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { planningSummaryAccessibilityLabels } from "@/features/planning/summaryPresentation";
import type { PlanningTotalsApi } from "@/services/api/types";

interface PlanningSummaryProps {
  currencyCode: string;
  locale: string;
  totals: PlanningTotalsApi;
}

export function PlanningSummary({ currencyCode, locale, totals }: PlanningSummaryProps) {
  const labels = planningSummaryAccessibilityLabels(totals, currencyCode, locale);
  const accessibilityLabel = `${labels.income} ${labels.commitments}`;

  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-bold uppercase text-text-muted">Planning Summary</Text>
      <View accessibilityLabel={accessibilityLabel} className="rounded-xl border border-surface-border bg-surface p-3">
        <View className="flex-row gap-3">
          <SummaryColumn
            label="Received"
            primary={<CurrencyText value={totals.incomeReceived} currencyCode={currencyCode} locale={locale} className="text-lg font-bold text-state-success" />}
            secondary={<CurrencyText value={totals.incomePlanned} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold" />}
            secondaryLabel="planned"
            title="Income"
          />
          <View className="w-px bg-surface-border" />
          <SummaryColumn
            label="Paid"
            primary={<CurrencyText value={totals.commitmentsCompleted} currencyCode={currencyCode} locale={locale} className="text-lg font-bold" />}
            secondary={<CurrencyText value={totals.remainingCommitments} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold text-accent-gold" />}
            secondaryLabel="remaining"
            tertiary={<CurrencyText value={totals.commitmentsPlanned} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold" />}
            tertiaryLabel="planned"
            title="Commitments"
          />
        </View>
      </View>
    </View>
  );
}

function SummaryColumn({ label, primary, secondary, secondaryLabel, tertiary, tertiaryLabel, title }: { label: string; primary: React.ReactNode; secondary: React.ReactNode; secondaryLabel: string; tertiary?: React.ReactNode; tertiaryLabel?: string; title: string }) {
  return (
    <View className="min-w-0 flex-1 gap-2">
      <Text className="font-sans text-sm font-bold text-text" numberOfLines={1}>{title}</Text>
      <View className="gap-0.5">
        {primary}
        <Text className="font-sans text-xs text-text-muted">{label}</Text>
      </View>
      <View className="gap-0.5">
        <View className="flex-row items-center gap-1">
          {secondary}
          <Text className="font-sans text-xs text-text-muted">{secondaryLabel}</Text>
        </View>
        {tertiary && tertiaryLabel ? (
          <View className="flex-row items-center gap-1">
            {tertiary}
            <Text className="font-sans text-xs text-text-muted">{tertiaryLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
