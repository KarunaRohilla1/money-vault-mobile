import { request } from "@/services/api/core";
import type { ReportsApiResponse } from "@/services/api/types";

export function getReports(token: string) {
  return request<ReportsApiResponse>({
    path: "/api/reports",
    token
  });
}
