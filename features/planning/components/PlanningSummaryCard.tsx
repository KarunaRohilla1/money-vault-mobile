import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import type { PlanningTotalsApi } from "@/services/api/types";

interface PlanningSummaryCardProps {
  currencyCode: string;
  locale: string;
  totals: PlanningTotalsApi;
}

export function PlanningSummaryCard({ currencyCode, locale, totals }: PlanningSummaryCardProps) {
  const incomePercent = totals.incomePlanned > 0 ? Math.round((totals.incomeReceived / totals.incomePlanned) * 100) : 0;
  const commitmentPercent = totals.commitmentsPlanned > 0 ? Math.round((totals.commitmentsCompleted / totals.commitmentsPlanned) * 100) : 0;
  const savingsDifference = totals.projectedSavings - totals.savingsGoal;
  const savingsPercent = totals.savingsGoal > 0 ? Math.round((totals.projectedSavings / totals.savingsGoal) * 100) : 0;

  return (
    <View className="gap-3">
      <Text className="font-sans text-sm font-bold uppercase text-text-muted">Planning Summary</Text>
      <View className="gap-3">
        <SummaryPanel title="Income" percent={incomePercent} tone="success">
          <MoneyLine currencyCode={currencyCode} label="Planned" locale={locale} value={totals.incomePlanned} />
          <MoneyLine currencyCode={currencyCode} label="Received" locale={locale} value={totals.incomeReceived} valueClassName="text-state-success" />
        </SummaryPanel>
        <SummaryPanel title="Commitments" percent={commitmentPercent} tone="warning">
          <MoneyLine currencyCode={currencyCode} label="Planned" locale={locale} value={totals.commitmentsPlanned} />
          <MoneyLine currencyCode={currencyCode} label="Paid" locale={locale} value={totals.commitmentsCompleted} valueClassName="text-state-success" />
          <MoneyLine currencyCode={currencyCode} label="Remaining" locale={locale} value={totals.remainingCommitments} valueClassName="text-accent-gold" />
        </SummaryPanel>
        <SummaryPanel title="Savings" percent={savingsPercent} tone="brand">
          <MoneyLine currencyCode={currencyCode} label="Goal" locale={locale} value={totals.savingsGoal} />
          <MoneyLine currencyCode={currencyCode} label="Projected" locale={locale} value={totals.projectedSavings} valueClassName="text-brand-soft" />
          <MoneyLine currencyCode={currencyCode} label="Difference" locale={locale} value={savingsDifference} valueClassName={savingsDifference >= 0 ? "text-state-success" : "text-accent-rose"} />
        </SummaryPanel>
      </View>
    </View>
  );
}

function SummaryPanel({ children, percent, title, tone }: { children: ReactNode; percent: number; title: string; tone: "brand" | "success" | "warning" }) {
  const badgeClass = tone === "success" ? "bg-state-success/10 text-state-success" : tone === "warning" ? "bg-accent-gold/10 text-accent-gold" : "bg-brand-deep text-brand-soft";

  return (
    <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-sm font-bold uppercase text-text">{title}</Text>
        <View className={`rounded-full px-3 py-1 ${badgeClass}`}>
          <Text className={`font-sans text-xs font-bold ${badgeClass}`}>{percent}%</Text>
        </View>
      </View>
      <View className="gap-2">{children}</View>
    </View>
  );
}

function MoneyLine({ currencyCode, label, locale, value, valueClassName }: { currencyCode: string; label: string; locale: string; value: number; valueClassName?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className={`text-sm font-bold ${valueClassName ?? ""}`} />
    </View>
  );
}
