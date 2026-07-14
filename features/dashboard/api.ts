import { useQuery } from "@tanstack/react-query";

import { adaptDashboardResponse } from "@/features/dashboard/adapter";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { DashboardApiResponse } from "@/services/api/types";

export function useDashboardQuery(token: string | null) {
  return useQuery({
    enabled: Boolean(token),
    queryFn: async () => adaptDashboardResponse(await apiClient.getDashboard(token ?? "")),
    queryKey: queryKeys.dashboard.current
  });
}

export type { DashboardApiResponse };
