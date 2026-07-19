import {
  accountBalance,
  accountBalanceLabel,
  accountFormError,
  LEGACY_ACCOUNT_TYPES,
  visibleAccountFormErrors
} from "@/features/accounts/accountModel";
import { isVaultScopedAccountDependentQuery } from "@/features/accounts/api";
import { queryKeys } from "@/lib/queryKeys";
import type { AccountApi } from "@/services/api/types";

const account: AccountApi = {
  balance: 1250,
  id: 1,
  isPrimary: true,
  name: "Salary",
  openingBalance: 1000,
  type: "Salary Account"
};

describe("accounts parity helpers", () => {
  it("uses the legacy account type list", () => {
    expect(LEGACY_ACCOUNT_TYPES).toEqual(["Salary Account", "Savings Account", "Credit Card", "Cash", "Other"]);
  });

  it("requires a name and opening balance", () => {
    expect(accountFormError({ name: "", openingBalance: "100", type: "Salary Account" })).toBe("Account name is required.");
    expect(accountFormError({ name: "Salary", openingBalance: "", type: "Salary Account" })).toBe("Opening balance cannot be empty.");
  });

  it("rejects zero and non-finite opening balances", () => {
    for (const value of ["0", "0.00", "-0"]) {
      expect(accountFormError({ name: "Salary", openingBalance: value, type: "Salary Account" })).toBe(
        "Opening balance must be greater than zero."
      );
    }

    for (const value of ["NaN", "Infinity", "-Infinity"]) {
      expect(accountFormError({ name: "Salary", openingBalance: value, type: "Salary Account" })).toBe("Opening balance must be a number.");
    }
  });

  it("does not show validation errors before touch or submit", () => {
    expect(visibleAccountFormErrors({ name: "", openingBalance: "", type: "" }, {}, false)).toEqual({});
  });

  it("shows validation after submit or field touch", () => {
    expect(visibleAccountFormErrors({ name: "", openingBalance: "", type: "" }, {}, true)).toEqual({
      name: "Account name is required.",
      openingBalance: "Opening balance cannot be empty.",
      type: "Account type is required."
    });
    expect(visibleAccountFormErrors({ name: "", openingBalance: "", type: "" }, { type: true }, false).type).toBe("Account type is required.");
  });

  it("allows negative opening balance only for credit cards", () => {
    expect(accountFormError({ name: "Salary", openingBalance: "-1", type: "Salary Account" })).toBe(
      "Opening balance cannot be negative."
    );
    expect(accountFormError({ name: "Card", openingBalance: "-1", type: "Credit Card" })).toBeNull();
  });

  it("shows a negative balance error when changing from credit card to a normal account", () => {
    expect(accountFormError({ name: "Card", openingBalance: "-1", type: "Cash" })).toBe("Opening balance cannot be negative.");
  });

  it("does not invent a balance when the backend omits one", () => {
    const { balance: _balance, ...accountWithoutBalance } = account;

    expect(accountBalance({ ...account, balance: null })).toBeNull();
    expect(accountBalance(accountWithoutBalance)).toBeNull();
    expect(accountBalance(account)).toBe(1250);
  });

  it("labels credit card balances as due amounts", () => {
    expect(accountBalanceLabel(account)).toBe("Available Balance");
    expect(accountBalanceLabel({ ...account, type: "Credit Card" })).toBe("Due Amount");
  });

  it("scopes dependent query refresh to the active vault", () => {
    expect(isVaultScopedAccountDependentQuery(queryKeys.transactions.list("vault-a"), "vault-a")).toBe(true);
    expect(isVaultScopedAccountDependentQuery(queryKeys.transfers.byVault("vault-a"), "vault-a")).toBe(true);
    expect(isVaultScopedAccountDependentQuery(queryKeys.transactions.list("vault-b"), "vault-a")).toBe(false);
    expect(isVaultScopedAccountDependentQuery(queryKeys.dashboard.current("vault-a"), "vault-a")).toBe(false);
  });
});
