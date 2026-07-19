import {
  activeTransferFilterCount,
  clearTransferFilter,
  clearTransferFilters,
  filtersKey,
  toTransferPayload,
  transferAmountError,
  transferFilterError,
  transferFormFromTransfer,
  transferFormError,
  updateTransferFilter,
  visibleTransferHistory,
  type TransferFormValues
} from "@/features/transfers/transferModel";
import { removeTransferFromCachedLists } from "@/features/transfers/api";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { TransferApi } from "@/services/api/types";

const validForm: TransferFormValues = {
  amount: "5000",
  date: "2026-07-10",
  fromAccountId: 1,
  notes: "Savings",
  toAccountId: 2
};

describe("transfer model", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("validates required accounts and prevents same-account transfers", () => {
    expect(transferFormError({ ...validForm, fromAccountId: null })).toBe("Choose both accounts.");
    expect(transferFormError({ ...validForm, toAccountId: null })).toBe("Choose both accounts.");
    expect(transferFormError({ ...validForm, toAccountId: 1 })).toBe("Accounts must be different.");
  });

  it("validates amount exactly like the legacy form constraint", () => {
    expect(transferFormError({ ...validForm, amount: "" })).toBe("Amount is required.");
    expect(transferFormError({ ...validForm, amount: "NaN" })).toBe("Amount must be a number.");
    expect(transferFormError({ ...validForm, amount: "0" })).toBe("Amount must be greater than zero.");
    expect(transferFormError({ ...validForm, amount: "-1" })).toBe("Amount must be greater than zero.");
    expect(transferFormError(validForm)).toBeNull();
  });

  it("returns field-level amount validation errors that clear when valid", () => {
    expect(transferAmountError("")).toBe("Amount is required.");
    expect(transferAmountError("0")).toBe("Amount must be greater than zero.");
    expect(transferAmountError("-5")).toBe("Amount must be greater than zero.");
    expect(transferAmountError("abc")).toBe("Amount must be a number.");
    expect(transferAmountError("5000")).toBeNull();
    expect(transferAmountError("100.50")).toBeNull();
  });

  it("validates date presence and actual calendar dates", () => {
    expect(transferFormError({ ...validForm, date: "" })).toBe("Date is required.");
    expect(transferFormError({ ...validForm, date: "not-a-date" })).toBe("Date must be a valid calendar date.");
    expect(transferFormError({ ...validForm, date: "2026-02-31" })).toBe("Date must be a valid calendar date.");
    expect(transferFormError({ ...validForm, date: "2024-02-29" })).toBeNull();
  });

  it("builds create and edit payloads without arbitrary transaction types", () => {
    expect(toTransferPayload(validForm)).toEqual({
      amount: 5000,
      date: "2026-07-10",
      fromAccountId: 1,
      notes: "Savings",
      toAccountId: 2
    });
  });

  it("preloads transfer edit form values including the existing date", () => {
    expect(
      transferFormFromTransfer({
        amount: 100.5,
        date: "2026-07-09",
        fromAccountId: 1,
        fromAccountName: "Salary",
        notes: null,
        toAccountId: 2,
        toAccountName: "Savings",
        transferGroupId: "group-1"
      })
    ).toEqual({
      amount: "100.5",
      date: "2026-07-09",
      fromAccountId: 1,
      notes: "",
      toAccountId: 2
    });
  });

  it("creates stable transfer filter keys", () => {
    expect(filtersKey({ accountId: 1, dateFrom: "2026-07-01", dateTo: "2026-07-31" })).toBe(
      '{"accountId":1,"dateFrom":"2026-07-01","dateTo":"2026-07-31"}'
    );
  });

  it("updates and clears selectable transfer filters without changing form state", () => {
    const form = { ...validForm };
    const accountFiltered = updateTransferFilter({}, "accountId", 7);
    const dateFiltered = updateTransferFilter(accountFiltered, "dateFrom", "2026-07-01");

    expect(accountFiltered).toEqual({ accountId: 7 });
    expect(dateFiltered).toEqual({ accountId: 7, dateFrom: "2026-07-01" });
    expect(clearTransferFilter(dateFiltered, "accountId")).toEqual({ accountId: null, dateFrom: "2026-07-01" });
    expect(clearTransferFilters()).toEqual({});
    expect(form).toEqual(validForm);
  });

  it("uses different query keys after filter selection and per vault", () => {
    expect(filtersKey({})).not.toBe(filtersKey({ accountId: 1 }));
    expect(queryKeys.transfers.list("vault-a", filtersKey({ accountId: 1 }))).not.toEqual(
      queryKeys.transfers.list("vault-b", filtersKey({ accountId: 1 }))
    );
  });

  it("validates transfer filters", () => {
    expect(transferFilterError({ dateFrom: "bad-date" })).toBe("From date must be valid.");
    expect(transferFilterError({ dateTo: "bad-date" })).toBe("To date must be valid.");
    expect(transferFilterError({ dateFrom: "2026-02-31" })).toBe("From date must be valid.");
    expect(transferFilterError({ dateFrom: "2026-07-31", dateTo: "2026-07-01" })).toBe("From date cannot be after To date.");
    expect(transferFilterError({ accountId: 1, dateFrom: "2026-07-01", dateTo: "2026-07-31" })).toBeNull();
    expect(activeTransferFilterCount({ accountId: 1, dateFrom: "2026-07-01", dateTo: null })).toBe(2);
  });

  it("switches between recent transfer history and View All history", () => {
    const items = [1, 2, 3, 4, 5, 6];

    expect(visibleTransferHistory(items, "recent")).toEqual([1, 2, 3, 4, 5]);
    expect(visibleTransferHistory(items, "all")).toEqual(items);
  });

  it("removes a deleted logical transfer from every cached list variant for the active vault", () => {
    const transfers: TransferApi[] = [
      { amount: 100, date: "2026-07-10", fromAccountId: 1, fromAccountName: "A", toAccountId: 2, toAccountName: "B", transferGroupId: "keep" },
      { amount: 200, date: "2026-07-11", fromAccountId: 2, fromAccountName: "B", toAccountId: 1, toAccountName: "A", transferGroupId: "delete" }
    ];

    queryClient.setQueryData(queryKeys.transfers.list("vault-a"), transfers);
    queryClient.setQueryData(queryKeys.transfers.list("vault-a", filtersKey({ accountId: 1 })), transfers);
    queryClient.setQueryData(queryKeys.transfers.list("vault-b"), transfers);

    removeTransferFromCachedLists("vault-a", "delete");

    expect(queryClient.getQueryData<TransferApi[]>(queryKeys.transfers.list("vault-a"))?.map((transfer) => transfer.transferGroupId)).toEqual(["keep"]);
    expect(queryClient.getQueryData<TransferApi[]>(queryKeys.transfers.list("vault-a", filtersKey({ accountId: 1 })))?.map((transfer) => transfer.transferGroupId)).toEqual(["keep"]);
    expect(queryClient.getQueryData<TransferApi[]>(queryKeys.transfers.list("vault-b"))?.map((transfer) => transfer.transferGroupId)).toEqual(["keep", "delete"]);
  });

  it("leaves undefined, non-array, detail, and other vault transfer cache data untouched", () => {
    const detail = { amount: 200, date: "2026-07-11", fromAccountId: 2, toAccountId: 1, transferGroupId: "delete" };

    queryClient.setQueryData(queryKeys.transfers.list("vault-a", "wrapped"), { items: [detail] });
    queryClient.setQueryData(queryKeys.transfers.detail("vault-a", "delete"), detail);
    queryClient.setQueryData(queryKeys.transfers.list("vault-b"), [
      { amount: 200, date: "2026-07-11", fromAccountId: 2, fromAccountName: "B", toAccountId: 1, toAccountName: "A", transferGroupId: "delete" }
    ]);

    removeTransferFromCachedLists("vault-a", "delete");

    expect(queryClient.getQueryData(queryKeys.transfers.list("vault-a", "missing"))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.transfers.list("vault-a", "wrapped"))).toEqual({ items: [detail] });
    expect(queryClient.getQueryData(queryKeys.transfers.detail("vault-a", "delete"))).toEqual(detail);
    expect(queryClient.getQueryData<TransferApi[]>(queryKeys.transfers.list("vault-b"))).toHaveLength(1);
  });
});
