import { request } from "@/services/api/core";
import type { SuccessApiResponse, TransferApi, TransferDetailApi, TransferPayloadApi } from "@/services/api/types";

export function getTransfers(token: string) {
  return request<TransferApi[]>({
    path: "/api/transfers",
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
