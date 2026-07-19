import { View } from "react-native";

import { AccountTypeSelector } from "@/features/accounts/AccountTypeSelector";
import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { StepIntro } from "@/features/onboarding/steps/stepUi";
import type { AccountType } from "@/services/api/accountTypes";

export function AccountTypeStep({ patchField, values }: OnboardingStepProps) {
  return (
    <View className="gap-4">
      <StepIntro title="What account would you like to add first?" subtitle="You can add more accounts later." />
      <AccountTypeSelector
        selected={values.accountKind ?? null}
        onSelect={(value: AccountType) => {
          patchField("accountKind", value);
          if (!values.accountName) {
            patchField("accountName", value);
          }
        }}
      />
    </View>
  );
}
