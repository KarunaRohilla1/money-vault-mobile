import { formatCurrency } from "@/lib/format";
import type { PlanningTotalsApi } from "@/services/api/types";

export interface PlanningSummaryPresentation {
  commitmentPercent: number;
  incomePercent: number;
  savingsDifference: number;
  savingsDifferenceLabel: string;
  savingsPercent: number;
}

export function percentOf(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

export function buildPlanningSummaryPresentation(totals: PlanningTotalsApi): PlanningSummaryPresentation {
  return {
    commitmentPercent: percentOf(totals.commitmentsCompleted, totals.commitmentsPlanned),
    incomePercent: percentOf(totals.incomeReceived, totals.incomePlanned),
    savingsDifference: totals.projectedSavings - totals.savingsGoal,
    savingsDifferenceLabel: savingsDifferenceLabel(totals.projectedSavings - totals.savingsGoal),
    savingsPercent: percentOf(totals.projectedSavings, totals.savingsGoal)
  };
}

export function savingsDifferenceLabel(difference: number) {
  if (difference > 0) {
    return "above goal";
  }
  if (difference < 0) {
    return "below goal";
  }
  return "Goal met exactly";
}

export function planningSummaryAccessibilityLabels(totals: PlanningTotalsApi, currencyCode: string, locale: string) {
  return {
    commitments: `Commitments. ${formatCurrency(totals.commitmentsCompleted, currencyCode, locale)} paid. ${formatCurrency(totals.remainingCommitments, currencyCode, locale)} remaining of ${formatCurrency(totals.commitmentsPlanned, currencyCode, locale)} planned.`,
    income: `Income. ${formatCurrency(totals.incomeReceived, currencyCode, locale)} received of ${formatCurrency(totals.incomePlanned, currencyCode, locale)} planned.`
  };
}
