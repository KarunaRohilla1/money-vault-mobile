import { Controller } from "react-hook-form";
import { TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { SecondaryButton } from "@/components/ui";
import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { InfoPanel, StepIntro } from "@/features/onboarding/steps/stepUi";
import { theme } from "@/theme";

export function SavingsGoalStep({ control, goToNext, patchField, saving }: OnboardingStepProps) {
  return (
    <View className="gap-4">
      <StepIntro title="What's your savings goal this month?" subtitle="This helps you stay on track and build better habits." />
      <FormField label="Monthly savings goal">
        <Controller
          control={control}
          name="monthlySavingsGoal"
          render={({ field: { onBlur, value } }) => (
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              inputMode="decimal"
              onBlur={onBlur}
              onChangeText={(text) => patchField("monthlySavingsGoal", text)}
              placeholder="Optional"
              placeholderTextColor={theme.colors.text.muted}
              value={value}
            />
          )}
        />
      </FormField>
      <InfoPanel icon="bullseye-arrow" title="Aim high, you've got this." body="You can update your goal anytime from Settings." />
      <SecondaryButton disabled={saving} onPress={() => goToNext("notifications")}>
        Skip
      </SecondaryButton>
    </View>
  );
}
