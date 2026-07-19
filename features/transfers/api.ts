import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { TransferApi, TransferFiltersApi, TransferPayloadApi } from "@/services/api/types";
import { filtersKey } from "@/features/transfers/transferModel";

export function removeTransferFromCachedLists(vaultId: string | null, transferGroupId: string) {
  queryClient.setQueriesData<unknown>({ queryKey: queryKeys.transfers.lists(vaultId) }, (current: unknown) => {
    if (!Array.isArray(current)) {
      return current;
    }

    return current.filter((transfer): transfer is TransferApi => {
      if (!transfer || typeof transfer !== "object" || !("transferGroupId" in transfer)) {
        return true;
      }

      return transfer.transferGroupId !== transferGroupId;
    });
  });
}

export async function invalidateTransferDependents(vaultId: string | null) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transfers.byVault(vaultId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.byVault(vaultId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.list(vaultId) })
  ]);
}

export function useTransfersQuery(token: string | null, vaultId: string | null, filters: TransferFiltersApi = {}) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getTransfers(token ?? "", filters),
    queryKey: queryKeys.transfers.list(vaultId, filtersKey(filters))
  });
}

export function useCreateTransferMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: TransferPayloadApi) => apiClient.createTransfer(token ?? "", body),
    onSuccess: async () => invalidateTransferDependents(vaultId)
  });
}

export function useUpdateTransferMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, transferGroupId }: { body: TransferPayloadApi; transferGroupId: string }) =>
      apiClient.updateTransfer(token ?? "", transferGroupId, body),
    onSuccess: async () => invalidateTransferDependents(vaultId)
  });
}

export function useDeleteTransferMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (transferGroupId: string) => apiClient.deleteTransfer(token ?? "", transferGroupId),
    onSuccess: async (_response, transferGroupId) => {
      removeTransferFromCachedLists(vaultId, transferGroupId);
      await invalidateTransferDependents(vaultId);
    }
  });
}
