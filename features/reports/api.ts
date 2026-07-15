import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";

export function useReportsQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getReports(token ?? ""),
    queryKey: queryKeys.reports.current(vaultId)
  });
}
