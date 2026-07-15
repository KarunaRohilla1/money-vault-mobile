import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";

export function useSettingsQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getSettings(token ?? ""),
    queryKey: queryKeys.settings.effective(vaultId)
  });
}
