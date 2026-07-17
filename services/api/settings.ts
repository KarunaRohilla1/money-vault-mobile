import { request } from "@/services/api/core";
import type { SettingsApiResponse } from "@/services/api/types";

export function getSettings(token: string) {
  return request<SettingsApiResponse>({
    path: "/api/settings",
    token
  });
}
