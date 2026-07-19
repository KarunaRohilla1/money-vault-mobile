import type { CurrencyCode } from "@/types/domain";

function fractionDigits(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number.isInteger(value) ? 0 : 2;
}

export function formatCurrency(value: number, currencyCode: CurrencyCode, locale = "en-US"): string {
  const normalized = Number(value.toFixed(2));

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: fractionDigits(normalized),
    maximumFractionDigits: 2
  }).format(normalized);
}
