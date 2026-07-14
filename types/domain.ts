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
  id: VaultId;
  isAdmin: boolean;
  name: string;
  vaultType: "Individual" | "Shared" | string;
}

export interface BackendSession {
  token: string;
  vault: AuthenticatedVault | null;
}

export interface ApiErrorShape {
  message: string;
  code?: string;
  cause?: unknown;
}
