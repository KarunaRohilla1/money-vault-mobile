import { z } from "zod";

import { cycleDays } from "@/features/onboarding/onboardingOptions";
import { ACCOUNT_TYPES } from "@/services/api/accountTypes";
import type { OnboardingDraft, OnboardingStep } from "@/stores/onboardingStore";

const vaultNameSchema = z.object({
  vaultName: z.string().trim().min(1, "Vault name is required.")
});

const firstAccountSchema = z.object({
  accountKind: z.enum(ACCOUNT_TYPES, "Choose the first account type.")
});

const accountDetailsSchema = z
  .object({
    accountKind: z.enum(ACCOUNT_TYPES, "Choose the first account type.").nullable(),
    accountName: z.string().trim().min(1, "Account name is required."),
    openingBalance: z.string().trim().min(1, "Opening balance is required.")
  })
  .refine((value) => Number.isFinite(Number(value.openingBalance)), {
    message: "Opening balance must be a number.",
    path: ["openingBalance"]
  })
  .refine((value) => {
    const amount = Number(value.openingBalance);
    return !Object.is(amount, -0) && amount !== 0;
  }, {
    message: "Opening balance must be greater than zero.",
    path: ["openingBalance"]
  })
  .refine((value) => value.accountKind === "Credit Card" || Number(value.openingBalance) >= 0, {
    message: "Opening balance cannot be negative.",
    path: ["openingBalance"]
  });

const cycleSchema = z.object({
  cycleStartDay: z.number().int().refine((value) => cycleDays.includes(value), "Choose a cycle start day.")
});

const savingsSchema = z.object({
  monthlySavingsGoal: z.string().refine((value) => value.trim() === "" || Number(value) >= 0, "Savings goal cannot be negative.")
});

export function validationMessage(step: OnboardingStep, values: OnboardingDraft) {
  switch (step) {
    case "vault-name":
      return vaultNameSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "first-account":
      return firstAccountSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "account-details":
      return accountDetailsSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "financial-cycle":
      return cycleSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "savings-goal":
      return savingsSchema.safeParse(values).error?.issues[0]?.message ?? null;
    case "welcome":
    case "finish":
      return null;
  }
}
