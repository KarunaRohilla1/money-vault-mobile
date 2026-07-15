import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { AccountPayloadApi } from "@/services/api/types";

function invalidateAccountDependents(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.transfers.root });
}

export function useAccountsQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getAccounts(token ?? ""),
    queryKey: queryKeys.accounts.byVault(vaultId)
  });
}

export function useCreateAccountMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: AccountPayloadApi) => apiClient.createAccount(token ?? "", body),
    onSuccess: () => invalidateAccountDependents(vaultId)
  });
}

export function useUpdateAccountMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ accountId, body }: { accountId: number; body: AccountPayloadApi }) =>
      apiClient.updateAccount(token ?? "", accountId, body),
    onSuccess: () => invalidateAccountDependents(vaultId)
  });
}

export function useDeleteAccountMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (accountId: number) => apiClient.deleteAccount(token ?? "", accountId),
    onSuccess: () => invalidateAccountDependents(vaultId)
  });
}

export function useSetPrimaryAccountMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (accountId: number) => apiClient.setPrimaryAccount(token ?? "", accountId),
    onSuccess: () => invalidateAccountDependents(vaultId)
  });
}
