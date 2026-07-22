import { invalidateTransactionDependents } from "@/features/transactions/api";
import { transactionIconName } from "@/features/transactions/transactionIconModel";
import { buildMonths, groupMonthsByYear, transactionsToCsv } from "@/features/transactions/transactionHistoryModel";
import { transactionLayout, transactionSpacing, transactionWidthRules } from "@/features/transactions/transactionLayout";
import {
  ALLOCATION_EQUAL,
  ALLOCATION_FIXED,
  ALLOCATION_PERCENTAGE,
  amountError,
  buildTransactionPayload,
  defaultSplitValues,
  rebalanceTwoParticipantAmounts,
  rebalanceTwoParticipantPercentages,
  splitPreview,
  transactionFormErrors,
  type SplitParticipant,
  type TransactionFormValues
} from "@/features/transactions/transactionFormModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

const participants: SplitParticipant[] = [
  { id: 4, isCurrent: true, name: "Karuna Rohilla" },
  { id: 5, name: "Asfar Sharief" }
];

const validForm: TransactionFormValues = {
  accountId: 1,
  allocationAmounts: { "4": "225", "5": "225" },
  allocationPercentages: { "4": "50", "5": "50" },
  amount: "450",
  categoryId: 2,
  date: "2026-07-10",
  expenseScope: "Personal",
  notes: "Coffee",
  sharedVaultId: 40,
  splitType: ALLOCATION_EQUAL,
  transactionType: "Expense"
};

describe("transaction form model", () => {
  it("validates amount using the legacy greater-than-zero rule", () => {
    expect(amountError("")).toBe("Amount is required.");
    expect(amountError("abc")).toBe("Amount must be a number.");
    expect(amountError("0")).toBe("Amount must be greater than zero.");
    expect(amountError("-1")).toBe("Amount must be greater than zero.");
    expect(amountError("450")).toBeNull();
  });

  it("validates required account, category, and date selections", () => {
    expect(transactionFormErrors({ ...validForm, accountId: 0 }, participants).accountId).toBe("Choose an account.");
    expect(transactionFormErrors({ ...validForm, categoryId: 0 }, participants).categoryId).toBe("Choose a category.");
    expect(transactionFormErrors({ ...validForm, date: "2026-02-31" }, participants).date).toBe("Date must be a valid calendar date.");
  });

  it("builds a personal expense payload without split fields", () => {
    expect(buildTransactionPayload(validForm, participants, null)).toEqual({
      accountId: 1,
      amount: 450,
      categoryId: 2,
      date: "2026-07-10",
      notes: "Coffee",
      transactionType: "Expense"
    });
  });

  it("builds a personal income payload with the selected income type", () => {
    expect(buildTransactionPayload({ ...validForm, expenseScope: "Personal", transactionType: "Income" }, participants, null)).toMatchObject({
      transactionType: "Income"
    });
  });

  it("previews equal split percentages and amounts live", () => {
    expect(splitPreview(450, ALLOCATION_EQUAL, participants, validForm)).toEqual([
      { amount: 225, id: 4, isCurrent: true, name: "Karuna Rohilla", percentage: 50 },
      { amount: 225, id: 5, isCurrent: false, name: "Asfar Sharief", percentage: 50 }
    ]);
  });

  it("shows shared participants in split preview before an amount is entered", () => {
    expect(splitPreview(0, ALLOCATION_EQUAL, participants, validForm)).toEqual([
      { amount: 0, id: 4, isCurrent: true, name: "Karuna Rohilla", percentage: 50 },
      { amount: 0, id: 5, isCurrent: false, name: "Asfar Sharief", percentage: 50 }
    ]);
  });

  it("requires percentage splits to total 100", () => {
    const invalid = {
      ...validForm,
      allocationPercentages: { "4": "60", "5": "30" },
      expenseScope: "Shared",
      splitType: ALLOCATION_PERCENTAGE
    } satisfies TransactionFormValues;

    expect(transactionFormErrors(invalid, participants).split).toBe("Split percentages must total 100%.");
    expect(transactionFormErrors({ ...invalid, allocationPercentages: { "4": "60", "5": "40" } }, participants).split).toBeUndefined();
  });

  it("requires fixed splits to total the transaction amount", () => {
    const invalid = {
      ...validForm,
      allocationAmounts: { "4": "200", "5": "200" },
      expenseScope: "Shared",
      splitType: ALLOCATION_FIXED
    } satisfies TransactionFormValues;

    expect(transactionFormErrors(invalid, participants).split).toBe("Fixed split amounts must total the transaction amount.");
    expect(transactionFormErrors({ ...invalid, allocationAmounts: { "4": "225", "5": "225" } }, participants).split).toBeUndefined();
  });

  it("builds shared transaction payloads using backend split fields", () => {
    expect(buildTransactionPayload({ ...validForm, expenseScope: "Shared", splitType: ALLOCATION_PERCENTAGE }, participants, null)).toEqual({
      accountId: 1,
      allocationMethod: "Percentage",
      amount: 450,
      beneficiaryVaultId: 40,
      categoryId: 2,
      date: "2026-07-10",
      notes: "Coffee",
      participantVaults: [4, 5],
      percentageAllocations: { "4": 50, "5": 50 },
      transactionType: "Expense"
    });
  });

  it("can force the active shared vault as beneficiary", () => {
    expect(buildTransactionPayload({ ...validForm, expenseScope: "Shared" }, participants, 44).beneficiaryVaultId).toBe(44);
  });

  it("creates default split values for percentage and fixed editors", () => {
    expect(defaultSplitValues(participants, 451)).toEqual({
      allocationAmounts: { "4": "225.5", "5": "225.5" },
      allocationPercentages: { "4": "50", "5": "50" }
    });
  });

  it("auto-balances a two-person percentage split to 100%", () => {
    expect(rebalanceTwoParticipantPercentages(participants, { "4": "50", "5": "50" }, 4, "65")).toEqual({
      "4": "65",
      "5": "35"
    });
  });

  it("caps two-person percentage splits between 0 and 100", () => {
    expect(rebalanceTwoParticipantPercentages(participants, { "4": "50", "5": "50" }, 4, "125")).toEqual({
      "4": "100",
      "5": "0"
    });
    expect(rebalanceTwoParticipantPercentages(participants, { "4": "50", "5": "50" }, 4, "-10")).toEqual({
      "4": "0",
      "5": "100"
    });
  });

  it("auto-balances a two-person fixed split to the transaction amount", () => {
    expect(rebalanceTwoParticipantAmounts(participants, { "4": "225", "5": "225" }, 4, "300", 450)).toEqual({
      "4": "300",
      "5": "150"
    });
  });

  it("does not guess the remaining allocation for larger shared groups", () => {
    const threeParticipants = [...participants, { id: 6, name: "Third Person" }];

    expect(rebalanceTwoParticipantPercentages(threeParticipants, { "4": "33", "5": "33", "6": "34" }, 4, "60")).toEqual({
      "4": "60",
      "5": "33",
      "6": "34"
    });
  });
});

describe("transaction query invalidation", () => {
  afterEach(() => {
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it("invalidates shared dashboard only when a shared vault id is supplied", () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    invalidateTransactionDependents("4", 40);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.root });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.accounts.root });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.categories.root });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.current("4") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.shared.dashboard("4", 40) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.shared.expenses("4", 40) });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: queryKeys.transfers.root });
  });
});

describe("transaction history helpers", () => {
  it("generates dynamic months from newest to oldest without a fixed cutoff", () => {
    expect(buildMonths("2026-04", "2026-07")).toEqual(["2026-07", "2026-06", "2026-05", "2026-04"]);
  });

  it("groups generated months by year for the month selector", () => {
    expect(groupMonthsByYear(["2026-01", "2025-12"], "en-IN")).toEqual([
      { months: [{ label: "January", value: "2026-01" }], year: "2026" },
      { months: [{ label: "December", value: "2025-12" }], year: "2025" }
    ]);
  });

  it("exports transaction CSV with escaped commas and quotes", () => {
    expect(
      transactionsToCsv([
        {
          date: "2026-07-10",
          label: "10 Jul",
          received: 0,
          spent: 220,
          summary: "Spent 220",
          transactions: [
            {
              account: "HDFC, Salary",
              amount: 220,
              category: "Food",
              categoryIcon: "coffee",
              date: "2026-07-10",
              direction: "debit",
              id: "1",
              merchant: "Starbucks \"Coffee\"",
              runningBalance: 42880,
              shared: false,
              title: "Starbucks",
              transactionId: 1,
              transactionType: "Expense",
              type: "expense"
            }
          ]
        }
      ])
    ).toContain("\"Starbucks \"\"Coffee\"\"\",\"Food\",\"HDFC, Salary\"");
  });

  it("keeps transaction history layout compact without wrapping filter chips", () => {
    expect(transactionLayout.chipRowClassName).not.toContain("flex-wrap");
    expect(transactionLayout.chipRowClassName).toContain("flex-row");
    expect(transactionLayout.dateHeaderClassName).not.toContain("border");
    expect(transactionLayout.dateHeaderClassName).not.toContain("mx-");
    expect(transactionLayout.rowContainerClassName).toBe("");
    expect(transactionLayout.pagePaddingClassName).toBe("px-4");
    expect(transactionLayout.transactionCardClassName).toContain("min-h-[76px]");
    expect(transactionLayout.transactionCardClassName).toContain("py-3.5");
    expect(transactionLayout.transactionDividerClassName).toContain("ml-14");
    expect(transactionLayout.sharedBadgeClassName).toContain("px-1.5");
  });

  it("keeps the Transactions page on a single 16dp horizontal grid", () => {
    expect(transactionSpacing.pageHorizontalPadding).toBe(16);
    expect(transactionSpacing.chipGap).toBe(8);
    expect(transactionSpacing.chipHorizontalPadding).toBe(12);
    expect(transactionSpacing.iconContainerSize).toBe(44);
    expect(transactionSpacing.iconToContentGap).toBe(12);
    expect(transactionSpacing.dividerStartOffset).toBe(56);
    expect(transactionSpacing.bottomContentPadding).toBe(112);
  });

  it.each([320, 360, 390, 412, 430])("keeps transaction content full-width at %idp", (width) => {
    expect(transactionWidthRules(width)).toMatchObject({
      contentWidth: width - 32,
      pageHorizontalPadding: 16,
      rowUsesFullContentWidth: true
    });
  });

  it("uses neutral category-appropriate icons instead of category artwork", () => {
    expect(transactionIconName({ category: "Dining", title: "Lunch", transactionType: "Expense", type: "expense" })).toBe("silverware-fork-knife");
    expect(transactionIconName({ category: "Subscriptions", title: "Music plan", transactionType: "Expense", type: "expense" })).toBe("calendar-refresh-outline");
    expect(transactionIconName({ category: "Transfer", title: "Move money", transactionType: "Transfer", type: "transfer" })).toBe("swap-horizontal");
  });
});
