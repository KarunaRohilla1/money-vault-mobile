import type { ComponentProps } from "react";

import type { MaterialCommunityIcons } from "@expo/vector-icons";

import type { AnalysisDimension } from "@/features/reports/analytics/analyticsState";
import type { ReportSpendingApiResponse, ReportSpendingVisualizationItemApi, ReportValueFormat } from "@/services/api/types";
import { theme } from "@/theme";

export type SpendingMetricIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface SpendingSummaryMetricViewModel {
  format: ReportValueFormat;
  iconName: SpendingMetricIconName;
  id: string;
  label: string;
  rawValue?: number | undefined;
  supportingText?: string | null;
  value: number | string | null;
}

export interface AnalyticsSummarySectionModel {
  metrics: SpendingSummaryMetricViewModel[];
  subtitle: string;
  title: string;
}

export interface AnalyticsSummaryCardModel {
  caption: string;
  format: ReportValueFormat;
  key: string;
  title: string;
  tone: string;
  value: number | string | null;
}

export interface ChartDataItem {
  amount: number;
  color: string;
  icon: string;
  iconName: SpendingMetricIconName;
  id: string;
  key: string;
  label: string;
  percent: number;
  transactionCount: number;
}

export interface AnalyticsViewModel {
  breakdown: {
    rows: ChartDataItem[];
    title: string;
  };
  chart: {
    items: ChartDataItem[];
    title: string;
    total: number;
    type: "donut" | "horizontalBar" | "verticalBar" | "percentageBar";
  };
  empty: {
    message: string;
    title: string;
  };
  filterOptions: ReportSpendingApiResponse["data"]["metadata"]["filterOptions"];
  question: string;
  summary: AnalyticsSummaryCardModel[];
  summarySection: AnalyticsSummarySectionModel;
  trend: {
    points: { amount: number; date: string; label: string }[];
    title: string;
  };
}

const summaryCopy: Record<AnalysisDimension, { subtitle: string; title: string }> = {
  accounts: { subtitle: "Which accounts funded spending", title: "Account Summary" },
  categories: { subtitle: "Where your spending went", title: "Category Summary" },
  merchants: { subtitle: "Who you spent with", title: "Merchant Summary" },
  paymentModes: { subtitle: "How you paid", title: "Payment Mode Summary" }
};

const summaryIcons: Record<AnalysisDimension, Record<string, SpendingMetricIconName>> = {
  accounts: {
    "highest-spending-account": "wallet-outline",
    "most-used-account": "wallet-outline",
    "total-cash-outflow": "wallet-outline",
    transactions: "receipt-text-outline"
  },
  categories: {
    "daily-average": "calendar-clock-outline",
    "highest-day": "fire",
    "total-spent": "receipt-text-outline",
    transactions: "format-list-bulleted"
  },
  merchants: {
    "average-per-merchant": "calculator-variant-outline",
    "largest-transaction": "receipt-outline",
    "top-merchant": "storefront-outline",
    "unique-merchants": "storefront-outline"
  },
  paymentModes: {
    "credit-card-spend": "credit-card-outline",
    "highest-spend-mode": "credit-card-outline",
    "most-used-mode": "credit-card-check-outline",
    "other-spend": "wallet-outline"
  }
};

const fallbackIcons: Record<AnalysisDimension, SpendingMetricIconName> = {
  accounts: "wallet-outline",
  categories: "chart-donut",
  merchants: "storefront-outline",
  paymentModes: "credit-card-outline"
};

const breakdownIconMap: Record<string, SpendingMetricIconName> = {
  account: "wallet-outline",
  accounts: "wallet-outline",
  bank: "bank-outline",
  card: "credit-card-outline",
  cash: "cash",
  category: "tag-outline",
  coffee: "coffee-outline",
  credit: "credit-card-outline",
  dining: "silverware-fork-knife",
  entertainment: "movie-open-outline",
  food: "silverware-fork-knife",
  fuel: "gas-station-outline",
  groceries: "cart-outline",
  grocery: "cart-outline",
  merchant: "storefront-outline",
  merchants: "storefront-outline",
  payment: "credit-card-outline",
  shopping: "shopping-outline",
  transport: "car-outline",
  upi: "cellphone"
};

export function adaptSpendingAnalytics(response: ReportSpendingApiResponse | undefined): AnalyticsViewModel | null {
  if (!response) {
    return null;
  }
  const dimension = response.data.metadata.dimension;
  const chartItems = response.data.visualization.items.map(toChartItem);
  const summarySection = toSummarySection(dimension, response.data.summary);
  return {
    breakdown: {
      rows: response.data.breakdown.rows.map((row) => ({
        amount: safeNumber(row.amount),
        color: chartItems.find((item) => item.key === row.key)?.color ?? theme.colors.brand.DEFAULT,
        icon: row.icon,
        iconName: iconNameFor(row.icon),
        id: row.id,
        key: row.key,
        label: row.label,
        percent: safeNumber(row.percent),
        transactionCount: safeNumber(row.transactionCount)
      })),
      title: response.data.breakdown.title
    },
    chart: {
      items: chartItems,
      title: response.data.visualization.title,
      total: safeNumber(response.data.visualization.total),
      type: response.data.visualization.type
    },
    empty: {
      message: response.data.metadata.emptyMessage,
      title: response.data.metadata.emptyTitle
    },
    filterOptions: response.data.metadata.filterOptions,
    question: response.data.metadata.question,
    summary: summarySection.metrics.map((metric) => ({
      caption: metric.supportingText ?? "",
      format: metric.format,
      key: metric.id,
      title: metric.label,
      tone: "neutral",
      value: metric.value
    })),
    summarySection,
    trend: response.data.trend
  };
}

export function hasAnalyticsData(model: AnalyticsViewModel | null) {
  if (!model) {
    return false;
  }
  return model.chart.items.length > 0 || model.trend.points.some((point) => safeNumber(point.amount) > 0) || model.summarySection.metrics.some((item) => safeNumber(item.value) > 0);
}

export function selectedChartItem(items: ChartDataItem[], selectedKey: string | null) {
  return items.find((item) => item.key === selectedKey) ?? items[0] ?? null;
}

export function trendMaximum(points: { amount: number }[]) {
  return Math.max(1, ...points.map((point) => Math.max(0, safeNumber(point.amount))));
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

export function activeFilterEntries(filters: object) {
  return Object.entries(filters).filter(([, value]) => value !== undefined && value !== "" && value !== null);
}

export function activeFilterCount(filters: object) {
  return activeFilterEntries(filters).length;
}

export function activeFilterSummary(filters: object, limit = 2) {
  const values = activeFilterEntries(filters).map(([, value]) => String(value));
  if (values.length === 0) {
    return null;
  }
  const visible = values.slice(0, limit).join(" · ");
  const hiddenCount = values.length - limit;
  return hiddenCount > 0 ? `${visible} +${hiddenCount}` : visible;
}

export function formatAnalyticsDateLabel(value: string | null | undefined, locale: string) {
  if (!value) {
    return null;
  }
  const datePart = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return value;
  }
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function toSummarySection(dimension: AnalysisDimension, metrics: AnalyticsSummaryCardModel[]): AnalyticsSummarySectionModel {
  const copy = summaryCopy[dimension];
  return {
    metrics: metrics.map((metric) => toSummaryMetric(dimension, metric)),
    subtitle: copy.subtitle,
    title: copy.title
  };
}

function toSummaryMetric(dimension: AnalysisDimension, metric: AnalyticsSummaryCardModel): SpendingSummaryMetricViewModel {
  return {
    format: metric.format,
    iconName: summaryIcons[dimension][metric.key] ?? fallbackIcons[dimension],
    id: metric.key,
    label: metric.title,
    rawValue: typeof metric.value === "number" ? safeNumber(metric.value) : undefined,
    supportingText: metric.caption || null,
    value: metric.value
  };
}

function toChartItem(item: ReportSpendingVisualizationItemApi): ChartDataItem {
  return {
    amount: safeNumber(item.amount),
    color: item.color,
    icon: item.icon,
    iconName: iconNameFor(item.icon),
    id: item.id,
    key: item.key,
    label: item.label,
    percent: safeNumber(item.percent),
    transactionCount: safeNumber(item.transactionCount)
  };
}

function iconNameFor(icon: string): SpendingMetricIconName {
  const normalized = icon.trim().toLowerCase().replace(/[_\s]+/g, "-");
  return breakdownIconMap[normalized] ?? "tag-outline";
}
