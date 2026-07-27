import { PlanningSummary } from "@/features/planning/components/summary/PlanningSummary";
import type { PlanningTotalsApi } from "@/services/api/types";

interface PlanningSummaryCardProps {
  currencyCode: string;
  locale: string;
  totals: PlanningTotalsApi;
}

export function PlanningSummaryCard({ currencyCode, locale, totals }: PlanningSummaryCardProps) {
  return <PlanningSummary currencyCode={currencyCode} locale={locale} totals={totals} />;
}
