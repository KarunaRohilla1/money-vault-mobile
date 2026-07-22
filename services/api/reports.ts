import { buildQuery, request } from "@/services/api/core";
import type { ReportsApiResponse } from "@/services/api/types";

export interface ReportsRequestParams {
  cycleStart?: string | undefined;
}

export function getReports(token: string, params: ReportsRequestParams = {}) {
  const query = buildQuery([["cycleStart", params.cycleStart]]);

  return request<ReportsApiResponse>({
    path: `/api/reports${query}`,
    token
  });
}
