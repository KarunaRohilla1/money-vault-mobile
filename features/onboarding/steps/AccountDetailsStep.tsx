import { Controller } from "react-hook-form";
import { TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { StepIntro } from "@/features/onboarding/steps/stepUi";
import { theme } from "@/theme";

export function AccountDetailsStep({ control, patchField, values }: OnboardingStepProps) {
  return (
    <View className="gap-4">
      <StepIntro title={`Tell us about your ${values.accountKind ?? "first account"}`} subtitle="You can edit these details anytime." />
      <FormField label="Account name">
        <Controller
          control={control}
          name="accountName"
          render={({ field: { onBlur, value } }) => (
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              onBlur={onBlur}
              onChangeText={(text) => patchField("accountName", text)}
              placeholder="Account name"
              placeholderTextColor={theme.colors.text.muted}
              value={value}
            />
          )}
        />
      </FormField>
      <FormField label="Opening balance">
        <Controller
          control={control}
          name="openingBalance"
          render={({ field: { onBlur, value } }) => (
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              inputMode="decimal"
              onBlur={onBlur}
              onChangeText={(text) => patchField("openingBalance", text)}
              placeholder="0"
              placeholderTextColor={theme.colors.text.muted}
              value={value}
            />
          )}
        />
      </FormField>
    </View>
  );
}
