import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { TransferPayloadApi } from "@/services/api/types";

function invalidateTransferDependents(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.transfers.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
}

export function useTransfersQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getTransfers(token ?? ""),
    queryKey: queryKeys.transfers.byVault(vaultId)
  });
}

export function useCreateTransferMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: TransferPayloadApi) => apiClient.createTransfer(token ?? "", body),
    onSuccess: () => invalidateTransferDependents(vaultId)
  });
}

export function useUpdateTransferMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, transferGroupId }: { body: TransferPayloadApi; transferGroupId: string }) =>
      apiClient.updateTransfer(token ?? "", transferGroupId, body),
    onSuccess: () => invalidateTransferDependents(vaultId)
  });
}

export function useDeleteTransferMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (transferGroupId: string) => apiClient.deleteTransfer(token ?? "", transferGroupId),
    onSuccess: () => invalidateTransferDependents(vaultId)
  });
}
