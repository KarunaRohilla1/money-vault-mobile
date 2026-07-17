import type { AuthenticatedVault } from "@/types/domain";

export interface LoginRequest {
  pin: string;
  vaultName: string;
}

export interface LoginResponse {
  expiresAt?: string;
  token: string;
  vault: AuthenticatedVault;
}
