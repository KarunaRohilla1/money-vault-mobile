import { buildQuery, request } from "@/services/api/core";
import type { ReportSpendingApiResponse, ReportSpendingRequestParams, ReportsApiResponse } from "@/services/api/types";

export interface ReportsRequestParams {
  cycleStart?: string | undefined;
  detailLevel?: "overview" | "full" | undefined;
}

export function getReports(token: string, params: ReportsRequestParams = {}) {
  const query = buildQuery([
    ["cycleStart", params.cycleStart],
    ["detailLevel", params.detailLevel]
  ]);

  return request<ReportsApiResponse>({
    path: `/api/reports${query}`,
    token
  });
}

export function getReportsSpending(token: string, params: ReportSpendingRequestParams = {}) {
  const query = buildQuery([
    ["cycleStart", params.cycleStart],
    ["dimension", params.dimension],
    ["account", params.account],
    ["category", params.category],
    ["merchant", params.merchant],
    ["paymentMode", params.paymentMode],
    ["transactionType", params.transactionType],
    ["amountMin", params.amountMin],
    ["amountMax", params.amountMax]
  ]);

  return request<ReportSpendingApiResponse>({
    path: `/api/reports/spending${query}`,
    token
  });
}
