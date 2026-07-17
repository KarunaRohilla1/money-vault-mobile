import {
  ApiClientError,
  isRecord,
  readBooleanField,
  readStringField,
  request
} from "@/services/api/core";
import type { LoginRequest, LoginResponse } from "@/services/api/types";

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

  if (!token || !isRecord(vault)) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
      details: {
        hasToken: Boolean(token),
        hasVault: isRecord(vault)
      },
      isNetworkError: false,
      status: null
    });
  }

  const id = readStringField(vault, ["id"]);
  const name = readStringField(vault, ["name"]);
  const isAdmin = readBooleanField(vault, ["isAdmin", "is_admin"]);
  const vaultType = readStringField(vault, ["vaultType", "vault_type"]);

  if (!id || !name || isAdmin === undefined || !vaultType) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
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

  const expiresAt = readStringField(value, ["expiresAt", "expires_at"]);

  return {
    ...(expiresAt ? { expiresAt } : {}),
    token,
    vault: {
      id,
      isAdmin,
      name,
      vaultType
    }
  };
}

export function login(body: LoginRequest) {
  return request<unknown, LoginRequest>({
    body,
    method: "POST",
    path: "/api/login"
  }).then(normalizeLoginResponse);
}
