import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";

export function useReportsQuery(token: string | null, vaultId: string | null, cycleStart?: string | undefined) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    placeholderData: keepPreviousData,
    queryFn: async () => apiClient.getReports(token ?? "", { cycleStart, detailLevel: "overview" }),
    queryKey: queryKeys.reports.summary(vaultId, { cycleStart }),
    staleTime: 60_000
  });
}

export function useReportsSpendingQuery(token: string | null, vaultId: string | null, filters: import("@/services/api/types").ReportSpendingRequestParams, enabled = true) {
  const filtersKey = JSON.stringify(filters);
  return useQuery({
    enabled: Boolean(enabled && token && vaultId),
    placeholderData: keepPreviousData,
    queryFn: async () => apiClient.getReportsSpending(token ?? "", filters),
    queryKey: queryKeys.reports.spending(vaultId, filtersKey),
    staleTime: 60_000
  });
}
