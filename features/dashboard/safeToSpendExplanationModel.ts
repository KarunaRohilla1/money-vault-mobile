import type { SafeToSpendBreakdownApi, SafeToSpendBreakdownItemApi } from "@/services/api/types";

export const SAFE_TO_SPEND_EXPLANATION_TITLE = "How Safe to Spend is calculated";
export const SAFE_TO_SPEND_EXPLANATION_BODY = "Safe to Spend is the money left after reserving funds for known obligations and your savings target.";

export function signedSafeToSpendItemAmount(item: SafeToSpendBreakdownItemApi) {
  return item.operation === "subtract" ? -Math.abs(item.amount) : Math.abs(item.amount);
}

export function safeToSpendBreakdownComponentTotal(breakdown: SafeToSpendBreakdownApi | null | undefined) {
  if (!breakdown) {
    return null;
  }

  return breakdown.items.reduce((sum, item) => sum + signedSafeToSpendItemAmount(item), 0);
}

export function safeToSpendBreakdownAddsUp(input: { breakdown: SafeToSpendBreakdownApi | null | undefined; safeToSpend: number }) {
  const total = safeToSpendBreakdownComponentTotal(input.breakdown);

  if (total === null || !Number.isFinite(input.safeToSpend)) {
    return false;
  }

  return Math.abs(total - input.safeToSpend) < 0.01 && Math.abs(input.breakdown!.total - input.safeToSpend) < 0.01;
}

export function safeToSpendOperationSymbol(item: SafeToSpendBreakdownItemApi, index: number) {
  if (index === 0 && item.operation === "add") {
    return "";
  }

  return item.operation === "subtract" ? "-" : "+";
}

export function hasSafeToSpendBreakdown(breakdown: SafeToSpendBreakdownApi | null | undefined) {
  return Boolean(breakdown && breakdown.items.length > 0 && safeToSpendBreakdownAddsUp({ breakdown, safeToSpend: breakdown.total }));
}
