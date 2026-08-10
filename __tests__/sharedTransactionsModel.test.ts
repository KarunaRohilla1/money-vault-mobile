import {
  canManageSharedExpense,
  filterSharedExpenses,
  findSharedExpenseById,
  groupSharedExpenses,
  mapSharedExpenseToFormValues,
  resolveSharedExpenseShares
} from "@/features/shared/sharedTransactionsModel";
import type { SharedExpenseApi } from "@/services/api/types";

const expense: SharedExpenseApi = {
  allocation_method: "Equal",
  amount: 450,
  category: "Dining",
  category_icon: "silverware-fork-knife",
  category_id: 1,
  date: "2026-08-08",
  id: 42,
  merchant: "Dinner at Blue Tokai",
  my_share: 225,
  notes: "",
  other_share: 225,
  paid_by: "You",
  paid_by_id: 1,
  settlement_amount: 0,
  settlement_label: "Settled",
  settlement_tone: "neutral",
  split_label: "Split 50/50"
};

describe("sharedTransactionsModel", () => {
  it("filters shared expenses by merchant, category, payer, and split label", () => {
    expect(filterSharedExpenses([expense], "blue tokai")).toHaveLength(1);
    expect(filterSharedExpenses([expense], "aman")).toHaveLength(0);
  });

  it("groups shared expenses by date for section lists", () => {
    const sections = groupSharedExpenses([expense], "en-IN", () => "receipt-text-outline");

    expect(sections).toHaveLength(1);
    expect(sections[0]?.data[0]).toMatchObject({
      id: 42,
      title: "Dinner at Blue Tokai",
      paidByLabel: "Paid by You"
    });
  });

  it("finds a shared expense by transaction id", () => {
    expect(findSharedExpenseById([expense], 42)?.merchant).toBe("Dinner at Blue Tokai");
    expect(findSharedExpenseById([expense], 99)).toBeNull();
  });

  it("allows edit and delete only for the payer", () => {
    expect(canManageSharedExpense(expense, 1)).toBe(true);
    expect(canManageSharedExpense(expense, 2)).toBe(false);
    expect(canManageSharedExpense(expense, null)).toBe(false);
  });

  it("maps shared expense shares into transaction form values", () => {
    const detailedExpense = {
      ...expense,
      account_id: 9,
      shares: [
        { amount: 225, participant_id: 1, percentage: 50 },
        { amount: 225, participant_id: 2, percentage: 50 }
      ]
    };

    expect(
      mapSharedExpenseToFormValues(detailedExpense, 40, [
        [1, "You"],
        [2, "Alex"]
      ], 1)
    ).toMatchObject({
      accountId: 9,
      amount: "450",
      categoryId: 1,
      expenseScope: "Shared",
      sharedVaultId: 40,
      splitType: "Equal",
      transactionType: "Expense",
      allocationAmounts: { "1": "225", "2": "225" },
      allocationPercentages: { "1": "50", "2": "50" }
    });
  });

  it("derives shares from my_share and other_share when backend shares are missing", () => {
    expect(
      resolveSharedExpenseShares(expense, [
        [1, "You"],
        [2, "Alex"]
      ], 1)
    ).toEqual([
      { amount: 225, participant_id: 1, percentage: 50 },
      { amount: 225, participant_id: 2, percentage: 50 }
    ]);
  });
});
