import type { OnboardingAccountKind } from "@/stores/onboardingStore";
import { ACCOUNT_TYPES, accountTypeMeta } from "@/services/api/accountTypes";

export const accountOptions: OnboardingAccountKind[] = [...ACCOUNT_TYPES];
export const cycleDays = Array.from({ length: 31 }, (_, index) => index + 1);

export const accountOptionMeta = accountTypeMeta;
