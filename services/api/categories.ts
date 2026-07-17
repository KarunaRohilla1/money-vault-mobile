import { request } from "@/services/api/core";
import type { CategoryApi, CategoryPayloadApi, SuccessApiResponse } from "@/services/api/types";

export function getCategories(token: string) {
  return request<CategoryApi[]>({
    path: "/api/categories",
    token
  });
}

export function createCategory(token: string, body: CategoryPayloadApi) {
  return request<SuccessApiResponse, CategoryPayloadApi>({
    body,
    method: "POST",
    path: "/api/categories",
    token
  });
}

export function updateCategory(token: string, categoryId: number, body: CategoryPayloadApi) {
  return request<SuccessApiResponse, CategoryPayloadApi>({
    body,
    method: "PUT",
    path: `/api/categories/${categoryId}`,
    token
  });
}

export function deleteCategory(token: string, categoryId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/categories/${categoryId}`,
    token
  });
}
