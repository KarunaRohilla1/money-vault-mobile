import { recentActivityDirection, recentActivitySignedAmount } from "@/features/dashboard/activityDirection";
import type { RecentActivityApi } from "@/services/api/types";

const base: RecentActivityApi = {
  amount: 100,
  categoryName: "Category",
  date: "2026-07-10",
  id: 1,
  transactionType: "Expense"
};

describe("recent activity direction", () => {
  it.each([
    ["Income", "credit", 100],
    ["Expense", "debit", -100],
    ["Transfer In", "credit", 100],
    ["Transfer Out", "debit", -100],
    ["Refund", "neutral", 0],
    ["income", "credit", 100]
  ] as const)("maps %s deterministically", (transactionType, direction, signedAmount) => {
    const item = { ...base, transactionType };

    expect(recentActivityDirection(item)).toBe(direction);
    expect(recentActivitySignedAmount(item)).toBe(signedAmount);
  });

  it("prefers backend-owned direction and signed amount when present", () => {
    const item: RecentActivityApi = {
      ...base,
      direction: "credit",
      signedAmount: 25,
      transactionType: "Expense"
    };

    expect(recentActivityDirection(item)).toBe("credit");
    expect(recentActivitySignedAmount(item)).toBe(25);
  });
});
