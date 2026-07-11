export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | string;

export type VaultId = string;

export interface VaultSummary {
  id: VaultId;
  name: string;
  currencyCode: CurrencyCode;
}

export interface ApiErrorShape {
  message: string;
  code?: string;
  cause?: unknown;
}
