import type { ReportSharedApiResponse } from "@/services/api/types";
import { reportNumber } from "@/features/reports/reportModel";

export function hasSharedReportData(report: ReportSharedApiResponse | undefined) {
  if (!report) {
    return false;
  }

  const { hero, categoryImpact, contribution, topExpenses } = report.data;

  return (
    reportNumber(hero.actualSpend) > 0 ||
    reportNumber(hero.projectedPersonalSpend) > 0 ||
    categoryImpact.length > 0 ||
    reportNumber(contribution.total) > 0 ||
    topExpenses.length > 0
  );
}

export function settlementToneClasses(tone: string) {
  if (tone === "green") {
    return { icon: "bg-accent-emerald/20", text: "text-accent-emerald" };
  }

  if (tone === "blue") {
    return { icon: "bg-state-info/20", text: "text-state-info" };
  }

  if (tone === "orange") {
    return { icon: "bg-accent-gold/20", text: "text-accent-gold" };
  }

  return { icon: "bg-brand-deep", text: "text-brand-soft" };
}

export const settlementCardIcons = {
  "partner-paid": "account-outline",
  "you-are-owed": "account-cash-outline",
  "you-owe": "account-alert-outline",
  "you-paid": "arrow-top-right"
} as const;
