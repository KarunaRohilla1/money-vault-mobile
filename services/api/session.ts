import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { ApiClientError, apiClient } from "@/services/api/client";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken, TokenStorageError } from "@/services/api/tokenStorage";
import type { LoginRequest, LoginResponse } from "@/services/api/types";
import type { BackendSession } from "@/types/domain";

export type LoginFlowStage =
  | "LOGIN_HTTP_SUCCESS"
  | "LOGIN_RESPONSE_NORMALIZED"
  | "TOKEN_VALIDATED"
  | "SECURE_STORE_WRITE_STARTED"
  | "SECURE_STORE_WRITE_SUCCEEDED"
  | "AUTH_STORE_UPDATED"
  | "ACCESS_STATE_READY"
  | "DASHBOARD_QUERY_STARTED";

export interface LoginFlowErrorDetails {
  cause?: unknown;
  code: string;
  stage: LoginFlowStage;
}

export class LoginFlowError extends Error {
  public readonly cause: unknown;
  public readonly code: string;
  public readonly stage: LoginFlowStage;

  public constructor(message: string, details: LoginFlowErrorDetails) {
    super(message);
    this.name = "LoginFlowError";
    this.cause = details.cause;
    this.code = details.code;
    this.stage = details.stage;
  }
}

export async function loginWithVaultCredentials(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.login(credentials);

  if (!response.token) {
    throw new LoginFlowError("Login did not return a usable token.", {
      code: "TOKEN_MISSING",
      stage: "TOKEN_VALIDATED"
    });
  }

  try {
    await setStoredAuthToken(response.token);
  } catch (error) {
    throw new LoginFlowError("Unable to save the login session.", {
      cause: error,
      code: error instanceof TokenStorageError ? error.code : "SECURE_STORE_WRITE_FAILED",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
  }

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
