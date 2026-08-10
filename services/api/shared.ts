import { buildQuery, request } from "@/services/api/core";
import type {
  SharedBillsApiResponse,
  SharedDashboardApiResponse,
  SharedExpensesApiResponse,
  SharedPageApiResponse,
  SharedSettlementHistoryPageApi,
  SharedSettlementPayloadApi,
  SharedSettlementsApiResponse,
  SuccessApiResponse
} from "@/services/api/types";

export function getSharedDashboard(token: string, sharedVaultId?: number) {
  return request<SharedDashboardApiResponse>({
    path: `/api/shared/dashboard${buildQuery([["sharedVaultId", sharedVaultId]])}`,
    token
  });
}

export function getSharedExpenses(token: string, sharedVaultId?: number) {
  return request<SharedPageApiResponse<SharedExpensesApiResponse>>({
    path: `/api/shared/expenses${buildQuery([["sharedVaultId", sharedVaultId]])}`,
    token
  });
}

export function getSharedBills(token: string, sharedVaultId?: number) {
  return request<SharedPageApiResponse<SharedBillsApiResponse>>({
    path: `/api/shared/bills${buildQuery([["sharedVaultId", sharedVaultId]])}`,
    token
  });
}

export function getSharedSettlements(token: string, sharedVaultId?: number) {
  return request<SharedPageApiResponse<SharedSettlementsApiResponse>>({
    path: `/api/shared/settlements${buildQuery([["sharedVaultId", sharedVaultId]])}`,
    token
  });
}

export function getSharedSettlementHistory(
  token: string,
  params: {
    direction?: string;
    limit?: number;
    offset?: number;
    sharedVaultId?: number;
  } = {}
) {
  return request<SharedPageApiResponse<SharedSettlementHistoryPageApi>>({
    path: `/api/shared/settlements/history${buildQuery([
      ["sharedVaultId", params.sharedVaultId],
      ["direction", params.direction],
      ["limit", params.limit],
      ["offset", params.offset]
    ])}`,
    token
  });
}

export function markSharedSettlement(token: string, body: SharedSettlementPayloadApi) {
  return request<SuccessApiResponse, SharedSettlementPayloadApi>({
    body,
    method: "POST",
    path: "/api/shared/settlements",
    token
  });
}

export function markSharedBillPaid(token: string, instanceId: number, payerVaultId: number, paymentDate: string) {
  return request<SuccessApiResponse, { payerVaultId: number; paymentDate: string }>({
    body: {
      payerVaultId,
      paymentDate
    },
    method: "POST",
    path: `/api/shared/bills/instances/${instanceId}/paid`,
    token
  });
}

export function skipSharedBill(token: string, instanceId: number) {
  return request<SuccessApiResponse>({
    method: "POST",
    path: `/api/shared/bills/instances/${instanceId}/skip`,
    token
  });
}
