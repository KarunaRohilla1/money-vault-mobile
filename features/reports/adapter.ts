import type { ReportSpendingApiResponse, ReportSpendingDistributionItemApi, ReportSpendingGroupingApi, ReportSpendingTrendPointApi } from "@/services/api/types";

export function spendingDistributionForGroup(report: ReportSpendingApiResponse | undefined, _group: ReportSpendingGroupingApi) {
  return (report?.data.visualization.items ?? []).map((item): ReportSpendingDistributionItemApi => ({
    amount: item.amount,
    color: item.color,
    icon: item.icon,
    id: item.id,
    key: item.key,
    name: item.label,
    percent: item.percent
  }));
}

export function spendingGroupTitle(group: ReportSpendingGroupingApi) {
  const labels: Record<ReportSpendingGroupingApi, string> = {
    accounts: "Spending by Account",
    categories: "Spending by Category",
    merchants: "Spending by Merchant",
    paymentModes: "Spending by Payment Mode"
  };
  return labels[group];
}

export function rankingTitle(group: ReportSpendingGroupingApi) {
  const labels: Record<ReportSpendingGroupingApi, string> = {
    accounts: "Top Accounts",
    categories: "Top Categories",
    merchants: "Top Merchants",
    paymentModes: "Top Payment Modes"
  };
  return labels[group];
}

export function selectedDistributionItem(rows: ReportSpendingDistributionItemApi[], selectedKey: string | null) {
  return rows.find((row) => row.key === selectedKey) ?? rows[0] ?? null;
}

export function spendingTotal(rows: ReportSpendingDistributionItemApi[]) {
  return rows.reduce((total, row) => total + safeNumber(row.amount), 0);
}

export function trendMaximumAmount(points: ReportSpendingTrendPointApi[]) {
  return Math.max(1, ...points.map((point) => Math.max(0, safeNumber(point.amount))));
}

export function hasSpendingData(report: ReportSpendingApiResponse | undefined) {
  if (!report) {
    return false;
  }
  return report.data.summary.some((metric) => safeNumber(metric.value) > 0) || report.data.visualization.items.length > 0 || report.data.trend.points.some((point) => safeNumber(point.amount) > 0);
}

export function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
