import type { AuthenticatedVault } from "@/types/domain";

export interface CredentialLoginRequest {
  pin: string;
  username: string;
}

export interface RegisterRequest {
  confirmPin: string;
  displayName: string;
  pin: string;
  username: string;
}

export interface LoginResponse {
  authenticatedVault?: AuthenticatedVault;
  displayName?: string;
  expiresAt?: string;
  inviteCode?: string;
  pinSet?: boolean;
  recoveryCode?: string;
  token: string;
  userId?: string;
  vault: AuthenticatedVault;
}

export interface RecoverPinRequest {
  confirmPin: string;
  newPin: string;
  recoveryCode: string;
  username: string;
}

export interface RecoveryCodeResponse {
  recoveryCode: string;
}

export interface SessionResponse {
  accessibleVaults: AuthenticatedVault[];
  authenticatedVault: AuthenticatedVault;
  displayName?: string;
  pinSet?: boolean;
  userId?: string;
  vault: AuthenticatedVault;
}

export interface SharedVaultActivationRequest {
  pin?: string;
  sharedVaultId: number;
}

export interface CreateSharedVaultRequest {
  vaultName: string;
}

export interface JoinSharedVaultRequest {
  inviteCode: string;
}

export interface SharedVaultSummaryApi {
  id: number;
  isAdmin: boolean;
  memberCount: number;
  name: string;
  role: "owner" | "member" | string;
  vaultType: "Shared" | string;
}

export interface SharedVaultMemberApi {
  displayName: string;
  isCurrentUser: boolean;
  role: "owner" | "member" | string;
  userId: string;
}

export interface SharedVaultDetailApi extends SharedVaultSummaryApi {
  inviteCode?: string | null;
  members: SharedVaultMemberApi[];
}

export interface SharedVaultRenameRequest {
  vaultName: string;
}

export interface ProfileUpdateRequest {
  displayName: string;
}

export interface PinSetRequest {
  confirmPin: string;
  pin: string;
}

export interface PinChangeRequest {
  confirmPin: string;
  currentPin: string;
  newPin: string;
}
