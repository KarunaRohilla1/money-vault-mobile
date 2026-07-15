import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { CategoryPayloadApi } from "@/services/api/types";

function invalidateCategoryDependents(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
}

export function useCategoriesQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getCategories(token ?? ""),
    queryKey: queryKeys.categories.byVault(vaultId)
  });
}

export function useCreateCategoryMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: CategoryPayloadApi) => apiClient.createCategory(token ?? "", body),
    onSuccess: () => invalidateCategoryDependents(vaultId)
  });
}

export function useUpdateCategoryMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ categoryId, body }: { categoryId: number; body: CategoryPayloadApi }) =>
      apiClient.updateCategory(token ?? "", categoryId, body),
    onSuccess: () => invalidateCategoryDependents(vaultId)
  });
}

export function useDeleteCategoryMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (categoryId: number) => apiClient.deleteCategory(token ?? "", categoryId),
    onSuccess: () => invalidateCategoryDependents(vaultId)
  });
}
