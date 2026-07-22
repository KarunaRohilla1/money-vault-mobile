import { recentActivityPrimaryText, recentActivitySecondaryText } from "@/features/dashboard/recentActivityDisplay";
import type { RecentActivityApi } from "@/services/api/types";

const baseActivity: RecentActivityApi = {
  amount: 220,
  categoryName: "Food",
  date: "2026-07-10",
  id: 1,
  transactionType: "Expense"
};

describe("dashboard recent activity display", () => {
  it("uses category as the primary line and notes as the secondary line", () => {
    const item = { ...baseActivity, notes: "Starbucks Coffee" };

    expect(recentActivityPrimaryText(item)).toBe("Food");
    expect(recentActivitySecondaryText(item)).toBe("Starbucks Coffee");
  });

  it("does not repeat category text as the secondary line", () => {
    const item = { ...baseActivity, notes: "Food" };

    expect(recentActivityPrimaryText(item)).toBe("Food");
    expect(recentActivitySecondaryText(item)).toBe("Expense");
  });

  it("falls back to merchant or description before transaction type", () => {
    expect(recentActivitySecondaryText({ ...baseActivity, merchant: "Netflix" })).toBe("Netflix");
    expect(recentActivitySecondaryText({ ...baseActivity, description: "Monthly subscription" })).toBe("Monthly subscription");
  });

  it("returns no secondary text when all meaningful fallbacks repeat category", () => {
    expect(recentActivitySecondaryText({ ...baseActivity, categoryName: "Expense", notes: "Expense", transactionType: "Expense" })).toBe("");
  });
});
