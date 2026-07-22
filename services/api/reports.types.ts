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
