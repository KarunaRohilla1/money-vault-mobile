import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { ApiClientError, apiClient } from "@/services/api/client";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "@/services/api/tokenStorage";
import type { LoginRequest, LoginResponse } from "@/services/api/types";
import type { BackendSession } from "@/types/domain";

export async function loginWithVaultCredentials(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.login(credentials);
  await setStoredAuthToken(response.token);
  queryClient.removeQueries({ queryKey: queryKeys.dashboard.root });
  return response;
}

export async function clearBackendSession(): Promise<void> {
  await clearStoredAuthToken();
  queryClient.removeQueries({ queryKey: queryKeys.dashboard.root });
}

export async function restoreBackendSession(): Promise<BackendSession | null> {
  const token = await getStoredAuthToken();

  if (!token) {
    return null;
  }

  try {
    const dashboard = await apiClient.getDashboard(token);
    return {
      token,
      vault: dashboard.vault
    };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      await clearBackendSession();
      return null;
    }

    throw error;
  }
}
