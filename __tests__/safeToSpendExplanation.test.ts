import { formatDashboardMoney } from "@/features/dashboard/dashboardLayout";
import {
  SAFE_TO_SPEND_EXPLANATION_BODY,
  hasSafeToSpendBreakdown,
  safeToSpendBreakdownAddsUp,
  safeToSpendBreakdownComponentTotal,
  safeToSpendOperationSymbol
} from "@/features/dashboard/safeToSpendExplanationModel";
import type { SafeToSpendBreakdownApi } from "@/services/api/types";

const breakdown: SafeToSpendBreakdownApi = {
  items: [
    { amount: 900, key: "available_cash", label: "Available Cash", operation: "add" },
    { amount: 100, key: "you_owe", label: "You Owe", operation: "subtract" },
    { amount: 500, key: "remaining_commitments", label: "Remaining Commitments", operation: "subtract" }
  ],
  total: 300
};

describe("safe to spend explanation model", () => {
  it("confirms backend-provided breakdown rows add up to displayed Safe to Spend", () => {
    expect(safeToSpendBreakdownComponentTotal(breakdown)).toBe(300);
    expect(safeToSpendBreakdownAddsUp({ breakdown, safeToSpend: 300 })).toBe(true);
    expect(safeToSpendBreakdownAddsUp({ breakdown, safeToSpend: 301 })).toBe(false);
  });

  it("supports zero totals from the legacy Safe to Spend floor", () => {
    const clamped: SafeToSpendBreakdownApi = {
      items: [
        { amount: 100, key: "available_cash", label: "Available Cash", operation: "add" },
        { amount: 150, key: "remaining_commitments", label: "Remaining Commitments", operation: "subtract" },
        { amount: 50, key: "minimum_safe_to_spend_floor", label: "Minimum Safe to Spend", operation: "add" }
      ],
      total: 0
    };

    expect(safeToSpendBreakdownComponentTotal(clamped)).toBe(0);
    expect(hasSafeToSpendBreakdown(clamped)).toBe(true);
  });

  it("formats operation symbols for positive and negative rows", () => {
    expect(safeToSpendOperationSymbol(breakdown.items[0]!, 0)).toBe("");
    expect(safeToSpendOperationSymbol(breakdown.items[1]!, 1)).toBe("-");
    expect(safeToSpendOperationSymbol({ amount: 50, key: "floor", label: "Floor", operation: "add" }, 2)).toBe("+");
  });

  it("hides triggers when breakdown is unavailable", () => {
    expect(hasSafeToSpendBreakdown(null)).toBe(false);
    expect(hasSafeToSpendBreakdown({ items: [], total: 0 })).toBe(false);
  });

  it("formats INR with en-IN grouping", () => {
    expect(formatDashboardMoney(26600, "INR", "en-IN")).toContain("26,600");
    expect(formatDashboardMoney(1234567, "INR", "en-IN")).toContain("12,34,567");
  });

  it("does not contain implementation-detail text in the user-facing modal", () => {
    expect(SAFE_TO_SPEND_EXPLANATION_BODY).not.toMatch(/API|backend|DTO|mobile app|client|implementation/i);
    expect(SAFE_TO_SPEND_EXPLANATION_BODY).toContain("Safe to Spend is the money left after reserving funds");
  });
});
