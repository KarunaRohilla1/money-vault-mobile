import { buildQuery, request } from "@/services/api/core";
import type {
  SuccessApiResponse,
  TransactionApi,
  TransactionDetailApi,
  TransactionFiltersApi,
  TransactionPayloadApi
} from "@/services/api/types";

export function getTransactions(token: string, filters: TransactionFiltersApi = {}) {
  return request<TransactionApi[]>({
    path: `/api/transactions${buildQuery([
      ["account", filters.account],
      ["category", filters.category],
      ["dateFrom", filters.dateFrom],
      ["dateTo", filters.dateTo],
      ["month", filters.month],
      ["search", filters.search],
      ["sortBy", filters.sortBy]
    ])}`,
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
