import {
  ApiClientError,
  isRecord,
  readBooleanField,
  readStringField,
  request
} from "@/services/api/core";
import type { AuthenticatedVault } from "@/types/domain";
import type {
  LoginResponse,
  PinChangeRequest,
  PinSetRequest,
  ProfileUpdateRequest,
  RegisterRequest,
  SessionResponse,
  SharedVaultActivationRequest,
  SharedVaultDetailApi,
  SharedVaultMemberApi,
  SharedVaultRenameRequest,
  SharedVaultSummaryApi,
  CreateSharedVaultRequest,
  JoinSharedVaultRequest,
  CredentialLoginRequest,
  RecoverPinRequest
} from "@/services/api/types";

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
  const displayName = readStringField(value, ["displayName", "display_name"]);
  const inviteCode = readStringField(value, ["inviteCode", "invite_code"]);
  const pinSet = readBooleanField(value, ["pinSet", "pin_set"]);
  const userId = readStringField(value, ["userId", "user_id"]);
  const recoveryCode = readStringField(value, ["recoveryCode", "recovery_code"]);

  return {
    ...(authenticatedVault ? { authenticatedVault: normalizeVault(authenticatedVault, "LOGIN_RESPONSE_INVALID") } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(displayName ? { displayName } : {}),
    ...(inviteCode ? { inviteCode } : {}),
    ...(pinSet !== undefined ? { pinSet } : {}),
    ...(recoveryCode ? { recoveryCode } : {}),
    token,
    ...(userId ? { userId } : {}),
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

  const displayName = readStringField(value, ["displayName", "display_name"]);
  const pinSet = readBooleanField(value, ["pinSet", "pin_set"]);
  const userId = readStringField(value, ["userId", "user_id"]);

  return {
    accessibleVaults: accessibleVaults.map((vault) => normalizeVault(vault, "SESSION_RESPONSE_INVALID")),
    authenticatedVault: normalizeVault(value.authenticatedVault ?? value.authenticated_vault, "SESSION_RESPONSE_INVALID"),
    ...(displayName ? { displayName } : {}),
    ...(pinSet !== undefined ? { pinSet } : {}),
    ...(userId ? { userId } : {}),
    vault: normalizeVault(value.vault, "SESSION_RESPONSE_INVALID")
  };
}

export function login(body: CredentialLoginRequest) {
  return request<unknown, CredentialLoginRequest>({
    body,
    method: "POST",
    path: "/api/login"
  }).then(normalizeLoginResponse);
}

export function register(body: RegisterRequest) {
  return request<unknown, RegisterRequest>({
    body,
    method: "POST",
    path: "/api/register"
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
  }).then((vaults) => vaults.map((vault) => normalizeSharedVaultSummary(vault)));
}

function readNumberField(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string" && candidate.trim() && Number.isFinite(Number(candidate))) {
      return Number(candidate);
    }
  }
  return undefined;
}

function normalizeSharedVaultSummary(value: unknown): SharedVaultSummaryApi {
  if (!isRecord(value)) {
    throw new ApiClientError("The shared vault response was incomplete.", {
      code: "SHARED_VAULTS_RESPONSE_INVALID",
      details: { reason: "vault_not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const id = readNumberField(value, ["id"]);
  const name = readStringField(value, ["name"]);
  const vaultType = readStringField(value, ["vaultType", "vault_type"]) ?? "Shared";
  const role = readStringField(value, ["role"]) ?? "member";
  const memberCount = readNumberField(value, ["memberCount", "member_count"]) ?? 0;
  const isAdmin = readBooleanField(value, ["isAdmin", "is_admin"]) ?? role === "owner";

  if (id === undefined || !name) {
    throw new ApiClientError("The shared vault response was incomplete.", {
      code: "SHARED_VAULTS_RESPONSE_INVALID",
      details: { hasId: id !== undefined, hasName: Boolean(name) },
      isNetworkError: false,
      status: null
    });
  }

  return {
    id,
    isAdmin,
    memberCount,
    name,
    role,
    vaultType
  };
}

function normalizeSharedVaultMember(value: unknown): SharedVaultMemberApi {
  if (!isRecord(value)) {
    throw new ApiClientError("The shared vault member response was incomplete.", {
      code: "SHARED_VAULT_DETAIL_INVALID",
      details: { reason: "member_not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const userId = readStringField(value, ["userId", "user_id"]);
  const displayName = readStringField(value, ["displayName", "display_name"]);
  const role = readStringField(value, ["role"]) ?? "member";
  const isCurrentUser = readBooleanField(value, ["isCurrentUser", "is_current_user"]) ?? false;

  if (!userId || !displayName) {
    throw new ApiClientError("The shared vault member response was incomplete.", {
      code: "SHARED_VAULT_DETAIL_INVALID",
      details: { hasUserId: Boolean(userId), hasDisplayName: Boolean(displayName) },
      isNetworkError: false,
      status: null
    });
  }

  return { displayName, isCurrentUser, role, userId };
}

function normalizeSharedVaultDetail(value: unknown): SharedVaultDetailApi {
  const summary = normalizeSharedVaultSummary(value);
  if (!isRecord(value)) {
    throw new ApiClientError("The shared vault detail response was incomplete.", {
      code: "SHARED_VAULT_DETAIL_INVALID",
      details: { reason: "not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const inviteCode = readStringField(value, ["inviteCode", "invite_code"]);
  const members = Array.isArray(value.members) ? value.members.map(normalizeSharedVaultMember) : [];

  return {
    ...summary,
    ...(inviteCode ? { inviteCode } : {}),
    members
  };
}

export function getSharedVaultDetail(token: string, sharedVaultId: number) {
  return request<unknown>({
    path: `/api/vaults/shared/${sharedVaultId}`,
    token
  }).then(normalizeSharedVaultDetail);
}

export function renameSharedVault(token: string, sharedVaultId: number, body: SharedVaultRenameRequest) {
  return request<unknown, SharedVaultRenameRequest>({
    body,
    method: "PATCH",
    path: `/api/vaults/shared/${sharedVaultId}`,
    token
  }).then(normalizeSharedVaultDetail);
}

export function leaveSharedVault(token: string, sharedVaultId: number) {
  return request<{ ok: boolean }>({
    method: "POST",
    path: `/api/vaults/shared/${sharedVaultId}/leave`,
    token
  });
}

export function removeSharedVaultMember(token: string, sharedVaultId: number, memberUserId: string) {
  return request<{ ok: boolean }>({
    method: "DELETE",
    path: `/api/vaults/shared/${sharedVaultId}/members/${encodeURIComponent(memberUserId)}`,
    token
  });
}

export function deleteSharedVault(token: string, sharedVaultId: number) {
  return request<{ ok: boolean }>({
    method: "DELETE",
    path: `/api/vaults/shared/${sharedVaultId}`,
    token
  });
}

export function activateSharedVault(token: string, body: SharedVaultActivationRequest) {
  return request<unknown, SharedVaultActivationRequest>({
    body,
    clearSessionOnUnauthorized: false,
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

export function updateProfile(token: string, body: ProfileUpdateRequest) {
  return request<unknown, ProfileUpdateRequest>({
    body,
    method: "PATCH",
    path: "/api/me",
    token
  }).then(normalizeSessionResponse);
}

export function setPin(token: string, body: PinSetRequest) {
  return request<unknown, PinSetRequest>({
    body,
    method: "POST",
    path: "/api/me/pin",
    token
  }).then(normalizeSessionResponse);
}

export function changePin(token: string, body: PinChangeRequest) {
  return request<unknown, PinChangeRequest>({
    body,
    clearSessionOnUnauthorized: false,
    method: "PATCH",
    path: "/api/me/pin",
    token
  }).then(normalizeSessionResponse);
}

export function recoverPin(body: RecoverPinRequest) {
  return request<unknown, RecoverPinRequest>({
    body,
    method: "POST",
    path: "/api/recover-pin"
  }).then(normalizeLoginResponse);
}

export function createRecoveryCode(token: string) {
  return request<unknown>({
    method: "POST",
    path: "/api/me/recovery-code",
    token
  }).then((value) => {
    if (!isRecord(value)) {
      throw new ApiClientError("The recovery code response was incomplete.", {
        code: "RECOVERY_CODE_RESPONSE_INVALID",
        details: { reason: "not_object" },
        isNetworkError: false,
        status: null
      });
    }
    const recoveryCode = readStringField(value, ["recoveryCode", "recovery_code"]);
    if (!recoveryCode) {
      throw new ApiClientError("The recovery code response was incomplete.", {
        code: "RECOVERY_CODE_RESPONSE_INVALID",
        details: { reason: "missing_code" },
        isNetworkError: false,
        status: null
      });
    }
    return { recoveryCode };
  });
}

export function createSharedVault(token: string, body: CreateSharedVaultRequest) {
  return request<unknown, CreateSharedVaultRequest>({
    body,
    method: "POST",
    path: "/api/vaults/shared/create",
    token
  }).then(normalizeLoginResponse);
}

export function joinSharedVault(token: string, body: JoinSharedVaultRequest) {
  return request<unknown, JoinSharedVaultRequest>({
    body,
    method: "POST",
    path: "/api/vaults/shared/join",
    token
  }).then(normalizeLoginResponse);
}
