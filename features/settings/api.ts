import { useMutation, useQuery } from "@tanstack/react-query";

import type { DashboardViewModel } from "@/features/dashboard/types";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { SharedVaultSummaryApi } from "@/services/api/types";

export const sharedVaultSafeToSpendInclusionMutationKey = [...queryKeys.vaults.shared, "safeToSpendInclusion"] as const;

type SharedVaultSafeToSpendInclusionVariables = {
  includeInSafeToSpend: boolean;
  sharedVaultId: number;
};

export function applySharedVaultSafeToSpendInclusion(
  vaults: SharedVaultSummaryApi[] | undefined,
  sharedVaultId: number,
  includeInSafeToSpend: boolean
) {
  if (!Array.isArray(vaults)) {
    return vaults;
  }

  return vaults.map((vault) =>
    Number(vault.id) === Number(sharedVaultId) ? { ...vault, includeInSafeToSpend } : vault
  );
}

export function isSharedVaultSafeToSpendTogglePending(
  pendingSharedVaultIds: readonly (number | undefined)[],
  sharedVaultId: number
) {
  return pendingSharedVaultIds.some((id) => id != null && Number(id) === Number(sharedVaultId));
}

export async function beginSharedVaultSafeToSpendInclusion(variables: SharedVaultSafeToSpendInclusionVariables) {
  await queryClient.cancelQueries({ queryKey: queryKeys.vaults.shared });
  const previous = queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared);
  const previousIncluded =
    previous?.find((vault) => Number(vault.id) === Number(variables.sharedVaultId))?.includeInSafeToSpend !== false;
  queryClient.setQueryData(
    queryKeys.vaults.shared,
    applySharedVaultSafeToSpendInclusion(previous, variables.sharedVaultId, variables.includeInSafeToSpend)
  );
  return { previousIncluded };
}

export function rollbackSharedVaultSafeToSpendInclusion(
  variables: SharedVaultSafeToSpendInclusionVariables,
  previousIncluded: boolean
) {
  queryClient.setQueryData(queryKeys.vaults.shared, (current: SharedVaultSummaryApi[] | undefined) =>
    applySharedVaultSafeToSpendInclusion(current, variables.sharedVaultId, previousIncluded)
  );
}

export const sharedVaultDashboardVisibilityMutationKey = [...queryKeys.vaults.shared, "dashboardVisibility"] as const;

type SharedVaultDashboardVisibilityVariables = {
  sharedVaultId: number;
  showOnDashboard: boolean;
};

export function applySharedVaultDashboardVisibility(
  vaults: SharedVaultSummaryApi[] | undefined,
  sharedVaultId: number,
  showOnDashboard: boolean
) {
  if (!Array.isArray(vaults)) {
    return vaults;
  }

  return vaults.map((vault) =>
    Number(vault.id) === Number(sharedVaultId) ? { ...vault, showOnDashboard } : vault
  );
}

export function applyDashboardSharedVaultVisibility(
  dashboard: DashboardViewModel | undefined,
  sharedVaultId: number,
  showOnDashboard: boolean
) {
  if (!dashboard) {
    return dashboard;
  }

  return {
    ...dashboard,
    sharedVaultBalances: dashboard.sharedVaultBalances.map((card) =>
      Number(card.id) === Number(sharedVaultId) ? { ...card, showOnDashboard } : card
    )
  };
}

export function isSharedVaultDashboardTogglePending(
  pendingSharedVaultIds: readonly (number | undefined)[],
  sharedVaultId: number
) {
  return isSharedVaultSafeToSpendTogglePending(pendingSharedVaultIds, sharedVaultId);
}

export async function beginSharedVaultDashboardVisibility(
  vaultId: string | null,
  variables: SharedVaultDashboardVisibilityVariables
) {
  await queryClient.cancelQueries({ queryKey: queryKeys.vaults.shared });
  await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  const previousVaults = queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared);
  const previousDashboard = queryClient.getQueryData<DashboardViewModel>(queryKeys.dashboard.current(vaultId));
  const previousVisible =
    previousVaults?.find((vault) => Number(vault.id) === Number(variables.sharedVaultId))?.showOnDashboard !== false;
  queryClient.setQueryData(
    queryKeys.vaults.shared,
    applySharedVaultDashboardVisibility(previousVaults, variables.sharedVaultId, variables.showOnDashboard)
  );
  queryClient.setQueryData(
    queryKeys.dashboard.current(vaultId),
    applyDashboardSharedVaultVisibility(previousDashboard, variables.sharedVaultId, variables.showOnDashboard)
  );
  return { previousVisible };
}

export function rollbackSharedVaultDashboardVisibility(
  vaultId: string | null,
  variables: SharedVaultDashboardVisibilityVariables,
  previousVisible: boolean
) {
  queryClient.setQueryData(queryKeys.vaults.shared, (current: SharedVaultSummaryApi[] | undefined) =>
    applySharedVaultDashboardVisibility(current, variables.sharedVaultId, previousVisible)
  );
  queryClient.setQueryData(queryKeys.dashboard.current(vaultId), (current: DashboardViewModel | undefined) =>
    applyDashboardSharedVaultVisibility(current, variables.sharedVaultId, previousVisible)
  );
}

export function confirmSharedVaultDashboardVisibility(
  vaultId: string | null,
  data: SharedVaultSummaryApi,
  variables: SharedVaultDashboardVisibilityVariables
) {
  queryClient.setQueryData(queryKeys.vaults.shared, (current: SharedVaultSummaryApi[] | undefined) =>
    applySharedVaultDashboardVisibility(current, Number(data.id), data.showOnDashboard !== false)
  );
  queryClient.setQueryData(queryKeys.dashboard.current(vaultId), (current: DashboardViewModel | undefined) =>
    applyDashboardSharedVaultVisibility(current, Number(data.id), data.showOnDashboard !== false)
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
  invalidatePrimarySharedVaultDependents(vaultId, variables.sharedVaultId);
}

export function confirmSharedVaultSafeToSpendInclusion(
  vaultId: string | null,
  data: SharedVaultSummaryApi,
  variables: SharedVaultSafeToSpendInclusionVariables
) {
  queryClient.setQueryData(queryKeys.vaults.shared, (current: SharedVaultSummaryApi[] | undefined) =>
    applySharedVaultSafeToSpendInclusion(current, Number(data.id), data.includeInSafeToSpend !== false)
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
  invalidatePrimarySharedVaultDependents(vaultId, variables.sharedVaultId);
}

export function useSettingsQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getSettings(token ?? ""),
    queryKey: queryKeys.settings.effective(vaultId)
  });
}

export function invalidatePrimarySharedVaultDependents(vaultId: string | null, sharedVaultId?: number | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.vaults.primaryShared(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root, refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId), refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: queryKeys.shared.root, refetchType: "all" });
  if (sharedVaultId != null) {
    queryClient.invalidateQueries({ queryKey: queryKeys.shared.dashboard(vaultId, sharedVaultId), refetchType: "all" });
    queryClient.invalidateQueries({ queryKey: queryKeys.shared.settlements(vaultId, sharedVaultId), refetchType: "all" });
  }
}

export function usePrimarySharedVaultQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getPrimarySharedVault(token ?? ""),
    queryKey: queryKeys.vaults.primaryShared(vaultId)
  });
}

export function useSetPrimarySharedVaultMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (sharedVaultId: number) => apiClient.setPrimarySharedVault(token ?? "", { sharedVaultId }),
    onSuccess: (data, sharedVaultId) => {
      queryClient.setQueryData(queryKeys.vaults.primaryShared(vaultId), data);
      invalidatePrimarySharedVaultDependents(vaultId, sharedVaultId);
    }
  });
}

export function useShowSharedBalancesMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (showSharedBalancesOnDashboard: boolean) =>
      apiClient.updateSettings(token ?? "", { showSharedBalancesOnDashboard }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.effective(vaultId), data);
      invalidatePrimarySharedVaultDependents(vaultId);
    }
  });
}

export function useSharedVaultDashboardVisibilityMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ sharedVaultId, showOnDashboard }: SharedVaultDashboardVisibilityVariables) =>
      apiClient.setSharedVaultDashboardVisibility(token ?? "", sharedVaultId, { showOnDashboard }),
    mutationKey: sharedVaultDashboardVisibilityMutationKey,
    scope: { id: "shared-vault-dashboard-visibility" },
    onMutate: (variables) => beginSharedVaultDashboardVisibility(vaultId, variables),
    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }
      rollbackSharedVaultDashboardVisibility(vaultId, variables, context.previousVisible);
    },
    onSuccess: (data, variables) => {
      confirmSharedVaultDashboardVisibility(vaultId, data, variables);
    }
  });
}

export function useSharedVaultSafeToSpendInclusionMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ includeInSafeToSpend, sharedVaultId }: SharedVaultSafeToSpendInclusionVariables) =>
      apiClient.setSharedVaultSafeToSpendInclusion(token ?? "", sharedVaultId, { includeInSafeToSpend }),
    mutationKey: sharedVaultSafeToSpendInclusionMutationKey,
    scope: { id: "shared-vault-safe-to-spend-inclusion" },
    onMutate: (variables) => beginSharedVaultSafeToSpendInclusion(variables),
    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }
      rollbackSharedVaultSafeToSpendInclusion(variables, context.previousIncluded);
    },
    onSuccess: (data, variables) => {
      confirmSharedVaultSafeToSpendInclusion(vaultId, data, variables);
    }
  });
}

export function useClearPrimarySharedVaultMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async () => apiClient.clearPrimarySharedVault(token ?? ""),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vaults.primaryShared(vaultId), data);
      invalidatePrimarySharedVaultDependents(vaultId);
    }
  });
}
