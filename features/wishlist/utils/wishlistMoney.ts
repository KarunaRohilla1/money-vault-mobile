export function parseWishlistMoney(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return NaN;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : NaN;
}

export function formatWishlistMoneyInput(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...decimalParts] = normalized.split(".");
  const decimals = decimalParts.join("").slice(0, 2);
  const trimmedWhole = whole.replace(/^0+(?=\d)/, "");
  const grouped = trimmedWhole ? new Intl.NumberFormat("en-IN").format(Number(trimmedWhole)) : "";
  return decimalParts.length > 0 ? `${grouped}.${decimals}` : grouped;
}
