import {
  applyBulkAction,
  availableBulkActions,
  closeCycleProgressLabel,
  closeCycleSummary,
  closeItemKey,
  closeItemValidationMessage,
  isCloseItemInvalid,
  nextUnresolvedKey
} from "@/features/planning/closeCyclePresentation";
import type { CloseReviewItem, PlanningActivityViewModel } from "@/features/planning/planningModel";

function activity(id: number, kind: "commitment" | "income", name = kind === "income" ? "Salary" : "Rent"): PlanningActivityViewModel {
  return {
    accountId: 1,
    accountName: "HDFC",
    actualAmount: 1000,
    actualEntered: false,
    completeLabel: kind === "income" ? "Received" : "Paid",
    completeStatus: kind === "income" ? "RECEIVED" : "PAID",
    dueDay: id,
    expectedAmount: 1000 * id,
    icon: kind === "income" ? "cash" : "home-outline",
    id,
    kind,
    name,
    notes: null,
    status: "PENDING",
    statusLabel: "Pending"
  };
}

function item(id: number, kind: "commitment" | "income", patch: Partial<CloseReviewItem> = {}): CloseReviewItem {
  return {
    action: null,
    activity: activity(id, kind),
    amount: String(1000 * id),
    ...patch
  };
}

describe("close cycle presentation", () => {
  it("validates action selection and required amounts", () => {
    expect(isCloseItemInvalid(item(1, "commitment"))).toBe(true);
    expect(closeItemValidationMessage(item(1, "commitment"))).toBe("Choose an action.");
    expect(isCloseItemInvalid(item(1, "commitment", { action: "Paid", amount: "0" }))).toBe(true);
    expect(closeItemValidationMessage(item(1, "commitment", { action: "Paid", amount: "0" }))).toBe("Enter an amount greater than zero.");
    expect(isCloseItemInvalid(item(1, "commitment", { action: "Cancelled", amount: "0" }))).toBe(false);
  });

  it("summarizes live paid, cancelled, carried, reviewed, and remaining values", () => {
    const summary = closeCycleSummary([
      item(1, "commitment", { action: "Paid", amount: "1200" }),
      item(2, "commitment", { action: "Carry Forward", amount: "2000" }),
      item(3, "income", { action: "Cancelled", amount: "0" }),
      item(4, "income")
    ]);

    expect(summary.paidOrReceived).toEqual({ amount: 1200, count: 1 });
    expect(summary.carried).toEqual({ amount: 2000, count: 1 });
    expect(summary.cancelled).toEqual({ amount: 3000, count: 1 });
    expect(summary.reviewed).toBe(3);
    expect(summary.remaining).toBe(1);
    expect(closeCycleProgressLabel(summary)).toBe("3 / 4");
  });

  it("selects the next unresolved card for auto expansion", () => {
    const items = [
      item(1, "commitment", { action: "Paid" }),
      item(2, "commitment"),
      item(3, "income")
    ];

    expect(nextUnresolvedKey(items, 0)).toBe(closeItemKey(items[1]!));
    expect(nextUnresolvedKey(items, 1)).toBe(closeItemKey(items[2]!));
  });

  it("exposes valid bulk actions and applies them without changing payload semantics", () => {
    const items = [item(1, "commitment"), item(2, "income")];

    expect(availableBulkActions(items)).toEqual(["markPaid", "markReceived", "carryForward", "clear"]);
    expect(applyBulkAction(items, "markPaid").map((entry) => entry.action)).toEqual(["Paid", null]);
    expect(applyBulkAction(items, "markReceived").map((entry) => entry.action)).toEqual([null, "Paid"]);
    expect(applyBulkAction(items, "carryForward").map((entry) => entry.action)).toEqual(["Carry Forward", "Carry Forward"]);
    expect(applyBulkAction(applyBulkAction(items, "carryForward"), "clear").map((entry) => entry.action)).toEqual([null, null]);
  });

  it("returns no bulk actions for the empty ready state", () => {
    expect(availableBulkActions([])).toEqual([]);
    expect(closeCycleSummary([])).toMatchObject({ remaining: 0, reviewed: 0, total: 0 });
  });
});
