import {
  accountBalance,
  accountBalanceLabel,
  accountFormError,
  accountSummary,
  LEGACY_ACCOUNT_TYPES,
  visibleAccountFormErrors
} from "@/features/accounts/accountModel";
import { isVaultScopedAccountDependentQuery } from "@/features/accounts/api";
import { queryKeys } from "@/lib/queryKeys";
import {
  ACCOUNT_SECTION_ORDER,
  accountSectionFor,
  accountTypeIcon,
  groupAccountsBySection
} from "@/services/api/accountTypes";
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
    expect(LEGACY_ACCOUNT_TYPES).toEqual(["Salary Account", "Savings Account", "Credit Card", "Cash", "Wallet", "Other"]);
  });

  it("requires a name and opening balance", () => {
    expect(accountFormError({ name: "", openingBalance: "100", type: "Salary Account" })).toBe("Account name is required.");
    expect(accountFormError({ name: "Salary", openingBalance: "", type: "Salary Account" })).toBe("Opening balance cannot be empty.");
  });

  it("allows zero opening balances for non-credit-card accounts", () => {
    for (const value of ["0", "0.00", "-0"]) {
      expect(accountFormError({ name: "Swiggy Wallet", openingBalance: value, type: "Wallet" })).toBeNull();
    }
  });

  it("rejects non-finite opening balances", () => {
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

  it("summarizes net worth from cash/bank assets and credit-card liabilities", () => {
    expect(
      accountSummary([
        { ...account, balance: 198800, id: 1, type: "Salary Account" },
        { ...account, balance: 2500, id: 3, type: "Wallet" },
        { ...account, balance: -2000, id: 2, type: "Credit Card" }
      ])
    ).toEqual({
      assetAccounts: 2,
      assets: 201300,
      creditCards: 1,
      liabilities: 2000,
      netWorth: 199300
    });
  });

  it("groups wallet accounts into their own section", () => {
    const accounts = [
      { ...account, id: 1, name: "Salary", type: "Salary Account" },
      { ...account, id: 2, name: "Swiggy Wallet", type: "Wallet" },
      { ...account, id: 3, name: "HDFC Credit Card", type: "Credit Card" },
      { ...account, id: 4, name: "Brokerage", type: "Other" }
    ];

    expect(ACCOUNT_SECTION_ORDER).toEqual(["Cash & Bank", "Wallets", "Credit Cards", "Other Accounts"]);
    expect(accountSectionFor("Wallet")).toBe("Wallets");
    expect(accountTypeIcon("Wallet")).toBe("wallet");
    expect(groupAccountsBySection(accounts)).toEqual({
      "Cash & Bank": [accounts[0]],
      Wallets: [accounts[1]],
      "Credit Cards": [accounts[2]],
      "Other Accounts": [accounts[3]]
    });
  });

  it("scopes dependent query refresh to the active vault", () => {
    expect(isVaultScopedAccountDependentQuery(queryKeys.transactions.list("vault-a"), "vault-a")).toBe(true);
    expect(isVaultScopedAccountDependentQuery(queryKeys.transfers.byVault("vault-a"), "vault-a")).toBe(true);
    expect(isVaultScopedAccountDependentQuery(queryKeys.transactions.list("vault-b"), "vault-a")).toBe(false);
    expect(isVaultScopedAccountDependentQuery(queryKeys.dashboard.current("vault-a"), "vault-a")).toBe(false);
  });
});
