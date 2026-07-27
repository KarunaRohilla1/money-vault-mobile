import type { AuthenticatedVault } from "@/types/domain";

export type ReportValueFormat = "money" | "text" | "count";

export interface ReportCycleOptionApi {
  endDate: string;
  key: string;
  label: string;
  startDate: string;
  status: string;
}

export interface ReportFiltersApi {
  cycleStart: string;
  endDate: string;
  period: "cycle";
  startDate: string;
}

export interface ReportMoneyCardApi {
  caption: string;
  format: ReportValueFormat;
  key: string;
  title: string;
  tone: string;
  value: number | string;
}

export interface ReportReviewItemApi {
  format: ReportValueFormat;
  key: string;
  label: string;
  value: number | string | null;
}

export interface ReportBiggestPurchaseApi {
  amount: number;
  date?: string | null;
  title: string;
}

export interface ReportCycleProgressApi {
  completedTransactions: number;
  percent: number;
  totalTransactions: number;
}

export interface ReportFinancialReviewApi {
  biggestPurchase: ReportBiggestPurchaseApi;
  cycleProgress: ReportCycleProgressApi;
  largestExpense: ReportReviewItemApi;
  mostUsedAccount: ReportReviewItemApi;
  mostUsedCategory: ReportReviewItemApi;
  period: string;
  totalTransactions: number;
  transfers: number;
}

export interface ReportCategoryItemApi {
  amount: number;
  icon: string;
  key: string;
  name: string;
  percent: number;
}

export interface ReportTrendItemApi {
  cashOutflow: number;
  cycle: string;
  householdSpending: number;
  income: number;
  netPersonalCost: number;
  savings: number;
}

export interface ReportsDataApi {
  cashOutflowByCategory: ReportCategoryItemApi[];
  financialReview: ReportFinancialReviewApi;
  monthlyReview: ReportReviewItemApi[];
  monthlySummary: ReportReviewItemApi[];
  naturalLanguageResult: string | null;
  netPersonalCostByCategory: ReportCategoryItemApi[];
  overview: ReportMoneyCardApi[];
  sharedInsights: ReportReviewItemApi[];
  summary: Record<string, unknown>;
  trend: ReportTrendItemApi[];
}

export interface ReportsApiResponse {
  cycleOptions: ReportCycleOptionApi[];
  data: ReportsDataApi;
  filters: ReportFiltersApi;
  generatedAt: string;
  vault: AuthenticatedVault;
}
export type ReportSpendingDimensionApi = "categories" | "merchants" | "accounts" | "paymentModes";
export type ReportSpendingChartTypeApi = "donut" | "horizontalBar" | "verticalBar" | "percentageBar";
export type ReportSpendingComparisonDirectionApi = "up" | "down" | "flat";

export interface ReportSpendingComparisonApi {
  direction: ReportSpendingComparisonDirectionApi;
  label: string;
  percent: number;
}

export interface ReportSpendingSummaryMetricApi {
  caption: string;
  comparison?: ReportSpendingComparisonApi | null;
  format: ReportValueFormat;
  key: string;
  title: string;
  tone: string;
  value: number | string | null;
}

export interface ReportSpendingVisualizationItemApi {
  amount: number;
  color: string;
  icon: string;
  id: string;
  key: string;
  label: string;
  percent: number;
  transactionCount: number;
}

export interface ReportSpendingVisualizationApi {
  items: ReportSpendingVisualizationItemApi[];
  title: string;
  total: number;
  type: ReportSpendingChartTypeApi;
}

export interface ReportSpendingTrendPointApi {
  amount: number;
  date: string;
  label: string;
}

export interface ReportSpendingTrendApi {
  points: ReportSpendingTrendPointApi[];
  title: string;
}

export interface ReportSpendingBreakdownRowApi {
  amount: number;
  icon: string;
  id: string;
  key: string;
  label: string;
  percent: number;
  subLabel: string;
  transactionCount: number;
}

export interface ReportSpendingBreakdownApi {
  rows: ReportSpendingBreakdownRowApi[];
  title: string;
}

export interface ReportSpendingFilterOptionsApi {
  accounts: string[];
  categories: string[];
  merchants: string[];
  paymentModes: string[];
}

export interface ReportSpendingMetadataApi {
  dimension: ReportSpendingDimensionApi;
  emptyMessage: string;
  emptyTitle: string;
  filterOptions: ReportSpendingFilterOptionsApi;
  question: string;
}

export interface ReportSpendingDataApi {
  breakdown: ReportSpendingBreakdownApi;
  metadata: ReportSpendingMetadataApi;
  summary: ReportSpendingSummaryMetricApi[];
  trend: ReportSpendingTrendApi;
  visualization: ReportSpendingVisualizationApi;
}

export interface ReportSpendingApiResponse {
  data: ReportSpendingDataApi;
  filters: ReportFiltersApi;
  generatedAt: string;
  vault: AuthenticatedVault;
}

export interface ReportSpendingRequestParams {
  account?: string | undefined;
  amountMax?: number | undefined;
  amountMin?: number | undefined;
  category?: string | undefined;
  cycleStart?: string | undefined;
  dimension?: ReportSpendingDimensionApi | undefined;
  merchant?: string | undefined;
  paymentMode?: string | undefined;
  transactionType?: string | undefined;
}
export type ReportSpendingGroupingApi = ReportSpendingDimensionApi;

export interface ReportSpendingDistributionItemApi {
  amount: number;
  color: string;
  icon: string;
  id: string;
  key: string;
  name: string;
  percent: number;
}

export interface ReportSpendingMerchantItemApi {
  amount: number;
  category: string;
  id: string;
  logo?: string | null;
  name: string;
  percent: number;
  rank: number;
}
