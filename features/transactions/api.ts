import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { TransactionFiltersApi, TransactionPayloadApi } from "@/services/api/types";

function filtersKey(filters: TransactionFiltersApi) {
  return JSON.stringify({
    account: filters.account ?? "",
    category: filters.category ?? "",
    dateFrom: filters.dateFrom ?? "",
    dateTo: filters.dateTo ?? "",
    month: filters.month ?? "",
    search: filters.search ?? "",
    sortBy: filters.sortBy ?? "Newest"
  });
}

function invalidateTransactionDependents(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.transfers.root });
}

export function useTransactionsQuery(token: string | null, vaultId: string | null, filters: TransactionFiltersApi = {}) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getTransactions(token ?? "", filters),
    queryKey: queryKeys.transactions.list(vaultId, filtersKey(filters))
  });
}

export function useCreateTransactionMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: TransactionPayloadApi) => apiClient.createTransaction(token ?? "", body),
    onSuccess: () => invalidateTransactionDependents(vaultId)
  });
}

export function useUpdateTransactionMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, transactionId }: { body: TransactionPayloadApi; transactionId: number }) =>
      apiClient.updateTransaction(token ?? "", transactionId, body),
    onSuccess: () => invalidateTransactionDependents(vaultId)
  });
}

export function useDeleteTransactionMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (transactionId: number) => apiClient.deleteTransaction(token ?? "", transactionId),
    onSuccess: () => invalidateTransactionDependents(vaultId)
  });
}
