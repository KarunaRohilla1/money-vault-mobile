import type { IconName } from "@/constants/navigation";

export const ACCOUNT_TYPES = ["Salary Account", "Savings Account", "Credit Card", "Cash", "Other"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

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
    icon: "wallet-outline",
    subtitle: "Track cash in hand."
  },
  Other: {
    icon: "dots-horizontal-circle-outline",
    subtitle: "Investment, loan, or another account."
  }
};

export function isAccountType(value: string): value is AccountType {
  return ACCOUNT_TYPES.includes(value as AccountType);
}
