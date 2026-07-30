import type { ReportSpendingDimensionApi, ReportSpendingRequestParams } from "@/services/api/types";

export type AnalysisDimension = ReportSpendingDimensionApi;
export type SortMode = "amountDesc" | "amountAsc" | "nameAsc";

export interface ReportsAnalyticsFilters {
  account?: string | undefined;
  amountMax?: number | undefined;
  amountMin?: number | undefined;
  category?: string | undefined;
  merchant?: string | undefined;
  paymentMode?: string | undefined;
  transactionType?: string | undefined;
}

export interface ReportsAnalyticsState {
  analysisDimension: AnalysisDimension;
  filters: ReportsAnalyticsFilters;
  selectedCycle: string | null;
  sort: SortMode;
}

export const analysisDimensions: { icon: string; key: AnalysisDimension; label: string }[] = [
  { icon: "view-grid-outline", key: "merchants", label: "Categories" },
  { icon: "credit-card-outline", key: "accounts", label: "Accounts" },
  { icon: "wallet-outline", key: "paymentModes", label: "Payment Modes" }
];

export const defaultReportsAnalyticsState: ReportsAnalyticsState = {
  analysisDimension: "merchants",
  filters: {},
  selectedCycle: null,
  sort: "amountDesc"
};

export function analyticsStateToRequest(state: ReportsAnalyticsState): ReportSpendingRequestParams {
  return {
    account: state.filters.account,
    amountMax: state.filters.amountMax,
    amountMin: state.filters.amountMin,
    category: state.filters.category,
    cycleStart: state.selectedCycle ?? undefined,
    dimension: state.analysisDimension,
    merchant: state.filters.merchant,
    paymentMode: state.filters.paymentMode,
    transactionType: state.filters.transactionType
  };
}

export function hasAnalyticsFilters(filters: ReportsAnalyticsFilters) {
  return Object.values(filters).some((value) => value !== undefined && value !== "");
}
