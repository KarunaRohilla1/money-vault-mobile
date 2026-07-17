import { request } from "@/services/api/core";
import type { DashboardApiResponse } from "@/services/api/types";

export function getDashboard(token: string) {
  return request<DashboardApiResponse>({
    path: "/api/dashboard",
    token
  });
}
