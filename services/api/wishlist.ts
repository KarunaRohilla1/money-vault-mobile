import { request } from "@/services/api/core";
import type { SuccessApiResponse, WishlistApiResponse, WishlistItemPayloadApi } from "@/services/api/types";

export function getWishlist(token: string) {
  return request<WishlistApiResponse>({
    path: "/api/wishlist",
    token
  });
}

export function createWishlistItem(token: string, body: WishlistItemPayloadApi) {
  return request<SuccessApiResponse, WishlistItemPayloadApi>({
    body,
    method: "POST",
    path: "/api/wishlist/items",
    token
  });
}

export function updateWishlistItem(token: string, itemId: number, body: WishlistItemPayloadApi) {
  return request<SuccessApiResponse, WishlistItemPayloadApi>({
    body,
    method: "PUT",
    path: `/api/wishlist/items/${itemId}`,
    token
  });
}

export function deleteWishlistItem(token: string, itemId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/wishlist/items/${itemId}`,
    token
  });
}
