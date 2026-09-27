import { clearLocalPin, storeLocalPin } from "@/features/settings/security/services/pinLock.service";
import { queryClient } from "@/lib/queryClient";
import { ApiClientError, apiClient } from "@/services/api/client";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken, TokenStorageError } from "@/services/api/tokenStorage";
import type { LoginResponse, SessionResponse, SharedVaultActivationRequest } from "@/services/api/types";
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

export function sessionExtras(session: {
  displayName?: string | null;
  pinSet?: boolean | null;
  userId?: string | null;
}) {
  return {
    displayName: session.displayName ?? null,
    pinSet: session.pinSet === true,
    userId: session.userId ?? null
  };
}

async function persistLoginResponse(response: LoginResponse, pin?: string): Promise<LoginResponse> {
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

  if (pin) {
    await storeLocalPin(pin, response.userId);
  }

  queryClient.clear();
  return response;
}

export async function loginWithUsernamePin(username: string, pin: string): Promise<LoginResponse> {
  const response = await apiClient.login({ pin, username: username.trim() });
  return persistLoginResponse(response, pin);
}

export async function registerWithUsernamePin(values: {
  confirmPin: string;
  displayName: string;
  pin: string;
  username: string;
}): Promise<LoginResponse> {
  const response = await apiClient.register({
    confirmPin: values.confirmPin,
    displayName: values.displayName.trim(),
    pin: values.pin,
    username: values.username.trim()
  });
  return persistLoginResponse(response, values.pin);
}

export async function recoverPin(values: {
  confirmPin: string;
  newPin: string;
  recoveryCode: string;
  username: string;
}): Promise<LoginResponse> {
  const response = await apiClient.recoverPin({
    confirmPin: values.confirmPin,
    newPin: values.newPin,
    recoveryCode: values.recoveryCode.trim(),
    username: values.username.trim()
  });
  return persistLoginResponse(response, values.newPin);
}

export async function establishApiSession(accessToken: string): Promise<SessionResponse & { token: string }> {
  if (!accessToken) {
    throw new LoginFlowError("Login did not return a usable token.", {
      code: "TOKEN_MISSING",
      stage: "TOKEN_VALIDATED"
    });
  }

  try {
    await setStoredAuthToken(accessToken);
  } catch (error) {
    throw new LoginFlowError("Unable to save the login session.", {
      cause: error,
      code: error instanceof TokenStorageError ? error.code : "SECURE_STORE_WRITE_FAILED",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
  }

  const session = await apiClient.getSession(accessToken);
  queryClient.clear();
  return { ...session, token: accessToken };
}

export async function clearBackendSession(): Promise<void> {
  await clearStoredAuthToken();
  await clearLocalPin();
  queryClient.clear();
}

export async function restoreBackendSession(): Promise<BackendSession | null> {
  const token = await getStoredAuthToken();

  if (!token) {
    return null;
  }

  try {
    let session = await apiClient.getSession(token);

    // App restart must land on Personal Vault, never a previously active Shared Vault.
    if (session.vault?.vaultType === "Shared") {
      const personal = await apiClient.activatePersonalVault(token);
      return {
        accessibleVaults: session.accessibleVaults,
        authenticatedVault: personal.authenticatedVault ?? personal.vault,
        displayName: personal.displayName ?? session.displayName ?? null,
        pinSet: (personal.pinSet ?? session.pinSet) === true,
        token: personal.token,
        userId: personal.userId ?? session.userId ?? null,
        vault: personal.vault
      };
    }

    return {
      accessibleVaults: session.accessibleVaults,
      authenticatedVault: session.authenticatedVault,
      displayName: session.displayName ?? null,
      pinSet: session.pinSet === true,
      token,
      userId: session.userId ?? null,
      vault: session.vault
    };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      await clearBackendSession();
      return null;
    }

    throw error;
  }
}

async function storeReplacementSession(response: LoginResponse): Promise<LoginResponse> {
  try {
    await setStoredAuthToken(response.token);
  } catch (error) {
    throw new LoginFlowError("Unable to save the login session.", {
      cause: error,
      code: error instanceof TokenStorageError ? error.code : "SECURE_STORE_WRITE_FAILED",
      stage: "SECURE_STORE_WRITE_STARTED"
    });
  }

  queryClient.clear();
  return response;
}

export async function activateSharedVaultSession(token: string, body: SharedVaultActivationRequest): Promise<LoginResponse> {
  const response = await apiClient.activateSharedVault(token, body);
  return storeReplacementSession(response);
}

export async function activatePersonalVaultSession(token: string): Promise<LoginResponse> {
  const response = await apiClient.activatePersonalVault(token);
  return storeReplacementSession(response);
}
