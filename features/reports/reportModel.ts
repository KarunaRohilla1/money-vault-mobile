import type { ReportCategoryItemApi, ReportMoneyCardApi, ReportTrendItemApi, ReportValueFormat } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";
import { formatCurrency } from "@/lib/format";

export type ReportCategoryMetric = "cashOutflow" | "netPersonalCost" | "householdSpending";
export type ReportTrendMetric = "cashOutflow" | "householdSpending" | "income" | "netPersonalCost" | "savings";

export function reportNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

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
  return categories.length > 0 || trend.some((row) =>
    reportNumber(row.cashOutflow) > 0 ||
    reportNumber(row.netPersonalCost) > 0 ||
    reportNumber(row.householdSpending) > 0 ||
    reportNumber(row.income) > 0 ||
    reportNumber(row.savings) > 0
  );
}

export function trendMaximum(rows: ReportTrendItemApi[], metric: ReportTrendMetric) {
  return Math.max(1, ...rows.map((row) => Math.max(0, reportNumber(row[metric]))));
}

export function findReportCard(cards: ReportMoneyCardApi[], key: string) {
  return cards.find((card) => card.key === key);
}

export function pickHeroMetric(cards: ReportMoneyCardApi[], shared: boolean) {
  const preferredKey = shared ? "household" : "net-cost";
  return findReportCard(cards, preferredKey) ?? cards[0] ?? null;
}

export function pickHeroSecondaryMetrics(cards: ReportMoneyCardApi[], shared: boolean) {
  const keys = shared ? ["transactions", "top-category"] : ["income", "cash-outflow", "savings"];
  return keys.map((key) => findReportCard(cards, key)).filter((card): card is ReportMoneyCardApi => Boolean(card));
}

export function topCategories(rows: ReportCategoryItemApi[], expanded: boolean, limit = 5) {
  return expanded ? rows : rows.slice(0, limit);
}

export function largestCategoryInsight(rows: ReportCategoryItemApi[], shared: boolean) {
  const largest = rows[0];

  if (!largest || reportNumber(largest.amount) <= 0) {
    return null;
  }

  return shared
    ? `Most household spending went to ${largest.name}.`
    : `${largest.name} was your largest category this cycle.`;
}

export function trendMetricForVault(shared: boolean): ReportTrendMetric {
  return shared ? "householdSpending" : "netPersonalCost";
}

export function trendMetricLabel(metric: ReportTrendMetric) {
  const labels: Record<ReportTrendMetric, string> = {
    cashOutflow: "Cash Outflow",
    householdSpending: "Household Spending",
    income: "Income",
    netPersonalCost: "Net Personal Cost",
    savings: "Savings"
  };

  return labels[metric];
}

export function cycleComparison(rows: ReportTrendItemApi[], metric: ReportTrendMetric, currencyCode: CurrencyCode, locale: string) {
  if (rows.length < 2) {
    return null;
  }

  const current = reportNumber(rows[rows.length - 1]?.[metric]);
  const previous = reportNumber(rows[rows.length - 2]?.[metric]);

  if (previous <= 0 || current === previous) {
    return null;
  }

  const difference = Math.abs(current - previous);
  const percent = Math.round((difference / previous) * 100);
  const direction = current > previous ? "more" : "less";

  return `${formatCurrency(difference, currencyCode, locale)} ${direction} than previous cycle (${percent}% ${current > previous ? "increase" : "decrease"}).`;
}

export function shortCycleLabel(label: unknown) {
  return String(label ?? "").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ");
}
