import type { AuthenticatedVault } from "@/types/domain";

export interface LoginRequest {
  pin: string;
  vaultName: string;
}

export interface LoginResponse {
  authenticatedVault?: AuthenticatedVault;
  expiresAt?: string;
  token: string;
  vault: AuthenticatedVault;
}

export interface SessionResponse {
  accessibleVaults: AuthenticatedVault[];
  authenticatedVault: AuthenticatedVault;
  vault: AuthenticatedVault;
}

export interface SharedVaultActivationRequest {
  pin: string;
  sharedVaultId: number;
}
