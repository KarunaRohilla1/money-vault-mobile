import type { IconName } from "@/constants/navigation";
import type { OnboardingAccountKind } from "@/stores/onboardingStore";

export const accountOptions: OnboardingAccountKind[] = ["Salary Account", "Savings Account", "Credit Card", "Cash", "Other"];
export const cycleDays = [1, 5, 10, 15, 20, 25];

export const accountOptionMeta: Record<OnboardingAccountKind, { icon: IconName; subtitle: string }> = {
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
