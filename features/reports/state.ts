import type { ReportSpendingGroupingApi, ReportSpendingRequestParams } from "@/services/api/types";

export type SpendingGrouping = ReportSpendingGroupingApi;

export interface SpendingFilterState {
  account?: string | undefined;
  amountMax?: number | undefined;
  amountMin?: number | undefined;
  category?: string | undefined;
  merchant?: string | undefined;
  paymentMode?: string | undefined;
  transactionType?: string | undefined;
}

export const spendingGroupings: { icon: string; key: SpendingGrouping; label: string }[] = [
  { icon: "view-grid-outline", key: "categories", label: "Categories" },
  { icon: "storefront-outline", key: "merchants", label: "Merchants" },
  { icon: "credit-card-outline", key: "accounts", label: "Accounts" },
  { icon: "wallet-outline", key: "paymentModes", label: "Payment Modes" }
];

export const emptySpendingFilters: SpendingFilterState = {};

export function spendingFiltersToRequest(cycleStart: string | null, filters: SpendingFilterState): ReportSpendingRequestParams {
  return {
    account: filters.account,
    amountMax: filters.amountMax,
    amountMin: filters.amountMin,
    category: filters.category,
    cycleStart: cycleStart ?? undefined,
    merchant: filters.merchant,
    paymentMode: filters.paymentMode,
    transactionType: filters.transactionType
  };
}

export function hasSpendingFilters(filters: SpendingFilterState) {
  return Object.values(filters).some((value) => value !== undefined && value !== "");
}
