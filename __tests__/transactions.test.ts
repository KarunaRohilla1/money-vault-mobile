import { invalidateTransactionDependents } from "@/features/transactions/api";
import {
  ALLOCATION_EQUAL,
  ALLOCATION_FIXED,
  ALLOCATION_PERCENTAGE,
  amountError,
  buildTransactionPayload,
  defaultSplitValues,
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
