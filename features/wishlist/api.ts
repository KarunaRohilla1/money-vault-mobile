import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/services/api/client";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { WishlistCategoryPayloadApi, WishlistCategoryReorderPayloadApi, WishlistItemPayloadApi } from "@/services/api/types";

function invalidateWishlist(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.current(vaultId) });
}

export function useWishlistQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token),
    queryFn: async () => apiClient.getWishlist(token ?? ""),
    queryKey: queryKeys.wishlist.current(vaultId)
  });
}

export function useCreateWishlistCategoryMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: WishlistCategoryPayloadApi) => apiClient.createWishlistCategory(token ?? "", body),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}

export function useUpdateWishlistCategoryMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, categoryId }: { body: WishlistCategoryPayloadApi; categoryId: number }) =>
      apiClient.updateWishlistCategory(token ?? "", categoryId, body),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}

export function useDeleteWishlistCategoryMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ categoryId, fallback }: { categoryId: number; fallback?: string }) => apiClient.deleteWishlistCategory(token ?? "", categoryId, fallback),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}

export function useReorderWishlistCategoriesMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: WishlistCategoryReorderPayloadApi) => apiClient.reorderWishlistCategories(token ?? "", body),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}

export function useCreateWishlistItemMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: WishlistItemPayloadApi) => apiClient.createWishlistItem(token ?? "", body),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}

export function useUpdateWishlistItemMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, itemId }: { body: WishlistItemPayloadApi; itemId: number }) =>
      apiClient.updateWishlistItem(token ?? "", itemId, body),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}

export function useDeleteWishlistItemMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (itemId: number) => apiClient.deleteWishlistItem(token ?? "", itemId),
    onSuccess: () => invalidateWishlist(vaultId)
  });
}
