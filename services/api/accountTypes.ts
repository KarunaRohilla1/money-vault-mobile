import type { IconName } from "@/constants/navigation";

export const ACCOUNT_TYPES = ["Salary Account", "Savings Account", "Credit Card", "Cash", "Wallet", "Other"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_SECTION_ORDER = ["Cash & Bank", "Wallets", "Credit Cards", "Other Accounts"] as const;

export type AccountSection = (typeof ACCOUNT_SECTION_ORDER)[number];

export const accountTypeMeta: Record<AccountType, { icon: IconName; subtitle: string }> = {
  "Salary Account": {
    icon: "bank-outline",
    subtitle: "Track your income."
  },
  "Savings Account": {
    icon: "piggy-bank-outline",
    subtitle: "For your savings."
  },
  "Credit Card": {
    icon: "credit-card-outline",
    subtitle: "Track your card dues."
  },
  Cash: {
    icon: "cash",
    subtitle: "Track cash in hand."
  },
  Wallet: {
    icon: "wallet",
    subtitle: "Prepaid balances like Swiggy, Zomato, or UPI wallets."
  },
  Other: {
    icon: "dots-horizontal-circle-outline",
    subtitle: "Investment, loan, or another account."
  }
};

export function isAccountType(value: string): value is AccountType {
  return ACCOUNT_TYPES.includes(value as AccountType);
}

export function accountSectionFor(type: string): AccountSection {
  if (type === "Credit Card") {
    return "Credit Cards";
  }

  if (type === "Wallet") {
    return "Wallets";
  }

  if (type === "Other") {
    return "Other Accounts";
  }

  return "Cash & Bank";
}

export function accountTypeIcon(type: string): IconName {
  if (isAccountType(type)) {
    return accountTypeMeta[type].icon;
  }

  return "bank-outline";
}

export function groupAccountsBySection<T extends { type: string }>(accounts: T[]): Record<AccountSection, T[]> {
  const grouped = Object.fromEntries(ACCOUNT_SECTION_ORDER.map((section) => [section, [] as T[]])) as Record<AccountSection, T[]>;

  for (const account of accounts) {
    grouped[accountSectionFor(account.type)].push(account);
  }

  return grouped;
}
