import type { ReportCategoryItemApi, ReportTrendItemApi, ReportValueFormat } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";
import { formatCurrency } from "@/lib/format";

export function formatReportValue(value: number | string | null, format: ReportValueFormat, currencyCode: CurrencyCode, locale: string) {
  if (value === null) {
    return "None";
  }

  if (format === "money" && typeof value === "number") {
    return formatCurrency(value, currencyCode, locale);
  }

  if (format === "count" && typeof value === "number") {
    return String(Math.trunc(value));
  }

  return String(value);
}

export function hasReportData(categories: ReportCategoryItemApi[], trend: ReportTrendItemApi[]) {
  return categories.length > 0 || trend.some((row) => row.cashOutflow > 0 || row.netPersonalCost > 0 || row.householdSpending > 0 || row.income > 0 || row.savings > 0);
}

export function trendMaximum(rows: ReportTrendItemApi[], metric: keyof Pick<ReportTrendItemApi, "cashOutflow" | "householdSpending" | "income" | "netPersonalCost" | "savings">) {
  return Math.max(1, ...rows.map((row) => Math.max(0, row[metric])));
}
