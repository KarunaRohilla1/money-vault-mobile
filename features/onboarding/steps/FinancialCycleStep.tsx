import { View } from "react-native";

import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { cycleDays } from "@/features/onboarding/onboardingOptions";
import { ChoiceGroup, InfoPanel, StepIntro } from "@/features/onboarding/steps/stepUi";

export function FinancialCycleStep({ patchField, values }: OnboardingStepProps) {
  return (
    <View className="gap-4">
      <StepIntro
        title="Set your monthly financial cycle"
        subtitle="We'll organize your income, expenses, and commitments around this cycle."
      />
      <ChoiceGroup
        options={cycleDays}
        selected={values.cycleStartDay ?? null}
        onSelect={(value) => patchField("cycleStartDay", value)}
        labelFor={(value) => `${value}${ordinalSuffix(value)} of every month`}
      />
      <InfoPanel
        icon="calendar-month-outline"
        title="Your first cycle"
        body="Money Vault will generate your first financial cycle from the selected start day."
      />
    </View>
  );
}

function ordinalSuffix(value: number) {
  if (value === 1) {
    return "st";
  }

  return "th";
}
