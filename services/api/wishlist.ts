import { request } from "@/services/api/core";
import type {
  CompleteWishlistItemPayloadApi,
  SuccessApiResponse,
  WishlistApiResponse,
  WishlistCategoryPayloadApi,
  WishlistCategoryReorderPayloadApi,
  WishlistItemPayloadApi
} from "@/services/api/types";

export function getWishlist(token: string) {
  return request<WishlistApiResponse>({
    path: "/api/wishlist",
    token
  });
}

export function createWishlistCategory(token: string, body: WishlistCategoryPayloadApi) {
  return request<SuccessApiResponse, WishlistCategoryPayloadApi>({
    body,
    method: "POST",
    path: "/api/wishlist/categories",
    token
  });
}

export function updateWishlistCategory(token: string, categoryId: number, body: WishlistCategoryPayloadApi) {
  return request<SuccessApiResponse, WishlistCategoryPayloadApi>({
    body,
    method: "PUT",
    path: `/api/wishlist/categories/${categoryId}`,
    token
  });
}

export function reorderWishlistCategories(token: string, body: WishlistCategoryReorderPayloadApi) {
  return request<SuccessApiResponse, WishlistCategoryReorderPayloadApi>({
    body,
    method: "PUT",
    path: "/api/wishlist/categories/reorder",
    token
  });
}

export function deleteWishlistCategory(token: string, categoryId: number, fallback = "General") {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/wishlist/categories/${categoryId}?fallback=${encodeURIComponent(fallback)}`,
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

export function completeWishlistItem(token: string, itemId: number, body?: CompleteWishlistItemPayloadApi) {
  return request<SuccessApiResponse, CompleteWishlistItemPayloadApi | undefined>({
    body,
    method: "POST",
    path: `/api/wishlist/items/${itemId}/complete`,
    token
  });
}

export function reopenWishlistItem(token: string, itemId: number) {
  return request<SuccessApiResponse>({
    method: "POST",
    path: `/api/wishlist/items/${itemId}/reopen`,
    token
  });
}
