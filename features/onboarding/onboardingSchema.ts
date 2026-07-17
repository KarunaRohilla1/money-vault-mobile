import { z } from "zod";

import { cycleDays } from "@/features/onboarding/onboardingOptions";
import type { OnboardingDraft, OnboardingStep } from "@/stores/onboardingStore";

const vaultNameSchema = z.object({
  vaultName: z.string().trim().min(1, "Vault name is required.")
});

const firstAccountSchema = z.object({
  accountKind: z.enum(["Salary Account", "Savings Account", "Credit Card", "Cash", "Other"], "Choose the first account type.")
});

const accountDetailsSchema = z.object({
  accountBank: z.string().trim().min(1, "Bank or provider is required."),
  accountName: z.string().trim().min(1, "Account name is required."),
  openingBalance: z.string().refine((value) => value.trim() === "" || Number(value) >= 0, "Opening balance cannot be negative.")
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
