import { ApiClientError, apiClient } from "@/services/api/client";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "@/services/api/tokenStorage";
import type { LoginRequest, LoginResponse } from "@/services/api/types";
import type { BackendSession } from "@/types/domain";

export async function loginWithVaultCredentials(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.login(credentials);
  await setStoredAuthToken(response.token);
  return response;
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
      await clearStoredAuthToken();
      return null;
    }

    await clearStoredAuthToken();
    throw error;
  }
}
