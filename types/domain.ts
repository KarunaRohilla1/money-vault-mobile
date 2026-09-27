export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | string;

export type VaultId = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface VaultSummary {
  id: VaultId;
  name: string;
  currencyCode: CurrencyCode;
}

export interface AuthenticatedVault {
  authenticatedVaultId?: string;
  authenticatedVaultName?: string;
  authenticatedVaultType?: string;
  id: VaultId;
  isAdmin: boolean;
  name: string;
  vaultType: "Individual" | "Shared" | string;
}

export interface BackendSession {
  accessibleVaults: AuthenticatedVault[];
  authenticatedVault: AuthenticatedVault | null;
  displayName?: string | null;
  pinSet?: boolean;
  token: string;
  userId?: string | null;
  vault: AuthenticatedVault | null;
}

export interface ApiErrorShape {
  message: string;
  code?: string;
  cause?: unknown;
}
