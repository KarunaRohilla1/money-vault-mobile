import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { analyticsStateToRequest, type ReportsAnalyticsState } from "@/features/reports/analytics/analyticsState";
import { reportsAnalyticsQueryKeys } from "@/features/reports/analytics/queryKeys";
import { apiClient } from "@/services/api/client";

export function useSpendingAnalyticsQuery(token: string | null, vaultId: string | null, state: ReportsAnalyticsState) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    placeholderData: keepPreviousData,
    queryFn: async () => apiClient.getReportsSpending(token ?? "", analyticsStateToRequest(state)),
    queryKey: reportsAnalyticsQueryKeys.spending(vaultId, state),
    staleTime: 60_000
  });
}
