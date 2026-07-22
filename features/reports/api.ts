import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";

export function useReportsQuery(token: string | null, vaultId: string | null, cycleStart?: string | undefined) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getReports(token ?? "", { cycleStart }),
    queryKey: queryKeys.reports.summary(vaultId, { cycleStart })
  });
}
