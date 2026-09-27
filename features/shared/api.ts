import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { SharedSettlementPayloadApi } from "@/services/api/types";

export function invalidateSharedDependents(vaultId: string | null, sharedVaultId: number | null = null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.shared.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.shared.dashboard(vaultId, sharedVaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.shared.bills(vaultId, sharedVaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.shared.expenses(vaultId, sharedVaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.shared.settlements(vaultId, sharedVaultId) });
  queryClient.invalidateQueries({ queryKey: ["shared", "settlementHistory"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
}

export function useSharedDashboardQuery(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getSharedDashboard(token ?? "", sharedVaultId ?? undefined),
    queryKey: queryKeys.shared.dashboard(vaultId, sharedVaultId)
  });
}

export function useSharedExpensesQuery(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getSharedExpenses(token ?? "", sharedVaultId ?? undefined),
    queryKey: queryKeys.shared.expenses(vaultId, sharedVaultId)
  });
}

export function useSharedBillsQuery(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getSharedBills(token ?? "", sharedVaultId ?? undefined),
    queryKey: queryKeys.shared.bills(vaultId, sharedVaultId)
  });
}

export function useSharedSettlementsQuery(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getSharedSettlements(token ?? "", sharedVaultId ?? undefined),
    queryKey: queryKeys.shared.settlements(vaultId, sharedVaultId)
  });
}

export function useMarkSharedBillPaidMutation(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useMutation({
    mutationFn: async ({ instanceId, payerVaultId, paymentDate }: { instanceId: number; payerVaultId: number; paymentDate: string }) =>
      apiClient.markSharedBillPaid(token ?? "", instanceId, payerVaultId, paymentDate),
    onSuccess: () => invalidateSharedDependents(vaultId, sharedVaultId)
  });
}

export function useSkipSharedBillMutation(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useMutation({
    mutationFn: async (instanceId: number) => apiClient.skipSharedBill(token ?? "", instanceId),
    onSuccess: () => invalidateSharedDependents(vaultId, sharedVaultId)
  });
}

export function useMarkSharedSettlementMutation(token: string | null, vaultId: string | null, sharedVaultId: number | null = null) {
  return useMutation({
    mutationFn: async (body: SharedSettlementPayloadApi) => apiClient.markSharedSettlement(token ?? "", body),
    onSuccess: () => invalidateSharedDependents(vaultId, sharedVaultId)
  });
}
