import { buildQuery, request } from "@/services/api/core";
import type {
  SuccessApiResponse,
  TransactionDetailApi,
  TransactionFiltersApi,
  TransactionHistoryApiResponse,
  TransactionMonthRangeApi,
  TransactionPayloadApi
} from "@/services/api/types";

export function getTransactions(token: string, filters: TransactionFiltersApi = {}) {
  return request<TransactionHistoryApiResponse>({
    path: `/api/transactions${buildQuery([
      ["account", filters.account],
      ["amountMax", filters.amountMax],
      ["amountMin", filters.amountMin],
      ["category", filters.category],
      ["dateFrom", filters.dateFrom],
      ["dateTo", filters.dateTo],
      ["month", filters.month],
      ["search", filters.search],
      ["sharedOnly", filters.sharedOnly ? "true" : undefined],
      ["sortBy", filters.sortBy],
      ["transactionType", filters.transactionType]
    ])}`,
    token
  });
}

export function getTransactionMonthRange(token: string) {
  return request<TransactionMonthRangeApi>({
    path: "/api/transactions/month-range",
    token
  });
}

export function getTransaction(token: string, transactionId: number) {
  return request<TransactionDetailApi>({
    path: `/api/transactions/${transactionId}`,
    token
  });
}

export function createTransaction(token: string, body: TransactionPayloadApi) {
  return request<TransactionDetailApi, TransactionPayloadApi>({
    body,
    method: "POST",
    path: "/api/transactions",
    token
  });
}

export function updateTransaction(token: string, transactionId: number, body: TransactionPayloadApi) {
  return request<TransactionDetailApi, TransactionPayloadApi>({
    body,
    method: "PUT",
    path: `/api/transactions/${transactionId}`,
    token
  });
}

export function deleteTransaction(token: string, transactionId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/transactions/${transactionId}`,
    token
  });
}
