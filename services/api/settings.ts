import { request } from "@/services/api/core";
import type { SettingsApiResponse, SettingsUpdatePayloadApi } from "@/services/api/types";

export function getSettings(token: string) {
  return request<SettingsApiResponse>({
    path: "/api/settings",
    token
  });
}

export function updateSettings(token: string, body: SettingsUpdatePayloadApi) {
  return request<SettingsApiResponse, SettingsUpdatePayloadApi>({
    body,
    method: "PATCH",
    path: "/api/settings",
    token
  });
}
