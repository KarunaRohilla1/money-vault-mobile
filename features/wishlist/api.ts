import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { WishlistItemPayloadApi } from "@/services/api/types";

function invalidateWishlist(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
}

export function useWishlistQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getWishlist(token ?? ""),
    queryKey: queryKeys.wishlist.current(vaultId)
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
