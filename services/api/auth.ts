import {
  ApiClientError,
  isRecord,
  readBooleanField,
  readStringField,
  request
} from "@/services/api/core";
import type { AuthenticatedVault } from "@/types/domain";
import type { LoginRequest, LoginResponse, SessionResponse, SharedVaultActivationRequest } from "@/services/api/types";

function normalizeVault(value: unknown, responseCode: string): AuthenticatedVault {
  if (!isRecord(value)) {
    throw new ApiClientError("The vault response was incomplete.", {
      code: responseCode,
      details: { reason: "vault_not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const id = readStringField(value, ["id"]);
  const name = readStringField(value, ["name"]);
  const isAdmin = readBooleanField(value, ["isAdmin", "is_admin"]);
  const vaultType = readStringField(value, ["vaultType", "vault_type"]);
  const authenticatedVaultId = readStringField(value, ["authenticatedVaultId", "authenticated_vault_id"]);
  const authenticatedVaultName = readStringField(value, ["authenticatedVaultName", "authenticated_vault_name"]);
  const authenticatedVaultType = readStringField(value, ["authenticatedVaultType", "authenticated_vault_type"]);

  if (!id || !name || isAdmin === undefined || !vaultType) {
    throw new ApiClientError("The vault response was incomplete.", {
      code: responseCode,
      details: {
        hasId: Boolean(id),
        hasIsAdmin: isAdmin !== undefined,
        hasName: Boolean(name),
        hasVaultType: Boolean(vaultType)
      },
      isNetworkError: false,
      status: null
    });
  }

  return {
    ...(authenticatedVaultId ? { authenticatedVaultId } : {}),
    ...(authenticatedVaultName ? { authenticatedVaultName } : {}),
    ...(authenticatedVaultType ? { authenticatedVaultType } : {}),
    id,
    isAdmin,
    name,
    vaultType
  };
}

function normalizeLoginResponse(value: unknown): LoginResponse {
  if (!isRecord(value)) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
      details: { reason: "not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const token = readStringField(value, ["token", "access_token"]);
  const vault = value.vault;

  if (!token) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
      details: {
        hasToken: Boolean(token)
      },
      isNetworkError: false,
      status: null
    });
  }

  const expiresAt = readStringField(value, ["expiresAt", "expires_at"]);
  const normalizedVault = normalizeVault(vault, "LOGIN_RESPONSE_INVALID");
  const authenticatedVault = value.authenticatedVault ?? value.authenticated_vault;

  return {
    ...(authenticatedVault ? { authenticatedVault: normalizeVault(authenticatedVault, "LOGIN_RESPONSE_INVALID") } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    token,
    vault: normalizedVault
  };
}

function normalizeSessionResponse(value: unknown): SessionResponse {
  if (!isRecord(value)) {
    throw new ApiClientError("The session response was incomplete.", {
      code: "SESSION_RESPONSE_INVALID",
      details: { reason: "not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const accessibleVaults = Array.isArray(value.accessibleVaults)
    ? value.accessibleVaults
    : Array.isArray(value.accessible_vaults)
      ? value.accessible_vaults
      : [];

  return {
    accessibleVaults: accessibleVaults.map((vault) => normalizeVault(vault, "SESSION_RESPONSE_INVALID")),
    authenticatedVault: normalizeVault(value.authenticatedVault ?? value.authenticated_vault, "SESSION_RESPONSE_INVALID"),
    vault: normalizeVault(value.vault, "SESSION_RESPONSE_INVALID")
  };
}

export function login(body: LoginRequest) {
  return request<unknown, LoginRequest>({
    body,
    method: "POST",
    path: "/api/login"
  }).then(normalizeLoginResponse);
}

export function getSession(token: string) {
  return request<unknown>({
    path: "/api/session",
    token
  }).then(normalizeSessionResponse);
}

export function getSharedVaults(token: string) {
  return request<unknown[]>({
    path: "/api/vaults/shared",
    token
  }).then((vaults) => vaults.map((vault) => normalizeVault(vault, "SHARED_VAULTS_RESPONSE_INVALID")));
}

export function activateSharedVault(token: string, body: SharedVaultActivationRequest) {
  return request<unknown, SharedVaultActivationRequest>({
    body,
    method: "POST",
    path: "/api/vaults/shared/activate",
    token
  }).then(normalizeLoginResponse);
}

export function activatePersonalVault(token: string) {
  return request<unknown>({
    method: "POST",
    path: "/api/vaults/personal/activate",
    token
  }).then(normalizeLoginResponse);
}
