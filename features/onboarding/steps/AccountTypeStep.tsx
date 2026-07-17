import { View } from "react-native";

import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { accountOptionMeta, accountOptions } from "@/features/onboarding/onboardingOptions";
import { ChoiceGroup, StepIntro } from "@/features/onboarding/steps/stepUi";

export function AccountTypeStep({ patchField, values }: OnboardingStepProps) {
  return (
    <View className="gap-4">
      <StepIntro title="What account would you like to add first?" subtitle="You can add more accounts later." />
      <ChoiceGroup
        options={accountOptions}
        selected={values.accountKind ?? null}
        onSelect={(value) => {
          patchField("accountKind", value);
          if (!values.accountName) {
            patchField("accountName", value);
          }
        }}
        meta={accountOptionMeta}
      />
    </View>
  );
}
