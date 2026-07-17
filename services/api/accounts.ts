import { request } from "@/services/api/core";
import type { AccountApi, AccountPayloadApi, SuccessApiResponse } from "@/services/api/types";

export function getAccounts(token: string) {
  return request<AccountApi[]>({
    path: "/api/accounts",
    token
  });
}

export function createAccount(token: string, body: AccountPayloadApi) {
  return request<SuccessApiResponse, AccountPayloadApi>({
    body,
    method: "POST",
    path: "/api/accounts",
    token
  });
}

export function updateAccount(token: string, accountId: number, body: AccountPayloadApi) {
  return request<AccountApi, AccountPayloadApi>({
    body,
    method: "PUT",
    path: `/api/accounts/${accountId}`,
    token
  });
}

export function deleteAccount(token: string, accountId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/accounts/${accountId}`,
    token
  });
}

export function setPrimaryAccount(token: string, accountId: number) {
  return request<SuccessApiResponse>({
    method: "POST",
    path: `/api/accounts/${accountId}/primary`,
    token
  });
}
