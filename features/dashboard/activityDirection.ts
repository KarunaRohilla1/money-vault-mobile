import type { CashFlowDirection, RecentActivityApi } from "@/services/api/types";

export function recentActivityDirection(item: RecentActivityApi): CashFlowDirection {
  if (item.direction === "credit" || item.direction === "debit" || item.direction === "neutral") {
    return item.direction;
  }

  switch (item.transactionType.trim().toLowerCase()) {
    case "income":
    case "transfer in":
      return "credit";
    case "expense":
    case "transfer out":
      return "debit";
    default:
      return "neutral";
  }
}

export function recentActivitySignedAmount(item: RecentActivityApi): number {
  if (typeof item.signedAmount === "number" && Number.isFinite(item.signedAmount)) {
    return item.signedAmount;
  }

  const direction = recentActivityDirection(item);

  if (direction === "credit") {
    return Math.abs(item.amount);
  }

  if (direction === "debit") {
    return -Math.abs(item.amount);
  }

  return 0;
}
