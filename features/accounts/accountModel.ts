import type { AccountApi } from "@/services/api/types";
import { ACCOUNT_TYPES, isAccountType } from "@/services/api/accountTypes";

export const LEGACY_ACCOUNT_TYPES = ACCOUNT_TYPES;

export type LegacyAccountType = (typeof LEGACY_ACCOUNT_TYPES)[number];

export interface AccountFormValues {
  name: string;
  openingBalance: string;
  type: string;
}

export interface AccountFormTouched {
  name?: boolean;
  openingBalance?: boolean;
  type?: boolean;
}

export interface AccountFormErrors {
  name?: string;
  openingBalance?: string;
  type?: string;
}

export function accountFormErrors(values: AccountFormValues): AccountFormErrors {
  const errors: AccountFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Account name is required.";
  }

  if (!values.openingBalance.trim()) {
    errors.openingBalance = "Opening balance cannot be empty.";
  } else {
    const amount = Number(values.openingBalance);
    if (!Number.isFinite(amount)) {
      errors.openingBalance = "Opening balance must be a number.";
    } else if (Object.is(amount, -0) || amount === 0) {
      errors.openingBalance = "Opening balance must be greater than zero.";
    } else if (values.type !== "Credit Card" && amount < 0) {
      errors.openingBalance = "Opening balance cannot be negative.";
    }
  }

  if (!values.type.trim()) {
    errors.type = "Account type is required.";
  } else if (!isAccountType(values.type)) {
    errors.type = "Choose a valid account type.";
  }

  return errors;
}

export function accountFormError(values: AccountFormValues): string | null {
  const errors = accountFormErrors(values);
  return errors.name ?? errors.openingBalance ?? errors.type ?? null;
}

export function visibleAccountFormErrors(values: AccountFormValues, touched: AccountFormTouched, submitted: boolean): AccountFormErrors {
  const errors = accountFormErrors(values);
  const visibleErrors: AccountFormErrors = {};

  if ((submitted || touched.name) && errors.name) {
    visibleErrors.name = errors.name;
  }

  if ((submitted || touched.openingBalance) && errors.openingBalance) {
    visibleErrors.openingBalance = errors.openingBalance;
  }

  if ((submitted || touched.type) && errors.type) {
    visibleErrors.type = errors.type;
  }

  return visibleErrors;
}

export function accountBalance(account: AccountApi): number | null {
  return typeof account.balance === "number" ? account.balance : null;
}

export function accountBalanceLabel(account: AccountApi): string {
  return account.type === "Credit Card" ? "Due Amount" : "Available Balance";
}

export function accountSummary(accounts: AccountApi[]) {
  const summary = accounts.reduce(
    (current, account) => {
      const balance = accountBalance(account);

      if (balance === null) {
        return current;
      }

      if (account.type === "Credit Card") {
        return {
          ...current,
          creditCards: current.creditCards + 1,
          liabilities: current.liabilities + (balance < 0 ? Math.abs(balance) : 0)
        };
      }

      return {
        ...current,
        assets: current.assets + balance,
        assetAccounts: current.assetAccounts + 1
      };
    },
    {
      assetAccounts: 0,
      assets: 0,
      creditCards: 0,
      liabilities: 0
    }
  );

  return {
    ...summary,
    netWorth: summary.assets - summary.liabilities
  };
}
