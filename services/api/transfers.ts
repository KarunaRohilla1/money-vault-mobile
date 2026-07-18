import { request } from "@/services/api/core";
import type { SuccessApiResponse, TransferApi, TransferDetailApi, TransferFiltersApi, TransferPayloadApi } from "@/services/api/types";

export function getTransfers(token: string, filters: TransferFiltersApi = {}) {
  const query = new URLSearchParams();

  if (filters.accountId) {
    query.set("accountId", String(filters.accountId));
  }

  if (filters.dateFrom) {
    query.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    query.set("dateTo", filters.dateTo);
  }

  const queryString = query.toString();

  return request<TransferApi[]>({
    path: queryString ? `/api/transfers?${queryString}` : "/api/transfers",
    token
  });
}

export function createTransfer(token: string, body: TransferPayloadApi) {
  return request<TransferDetailApi, TransferPayloadApi>({
    body,
    method: "POST",
    path: "/api/transfers",
    token
  });
}

export function updateTransfer(token: string, transferGroupId: string, body: TransferPayloadApi) {
  return request<TransferDetailApi, TransferPayloadApi>({
    body,
    method: "PUT",
    path: `/api/transfers/${transferGroupId}`,
    token
  });
}

export function deleteTransfer(token: string, transferGroupId: string) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/transfers/${transferGroupId}`,
    token
  });
}
