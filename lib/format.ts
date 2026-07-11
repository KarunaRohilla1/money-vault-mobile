import type { CurrencyCode } from "@/types/domain";

export function formatCurrency(value: number, currencyCode: CurrencyCode, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(value);
}
