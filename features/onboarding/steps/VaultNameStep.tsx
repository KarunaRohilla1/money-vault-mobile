import { Controller } from "react-hook-form";
import { TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { IconBadge, StepIntro } from "@/features/onboarding/steps/stepUi";
import { theme } from "@/theme";

export function VaultNameStep({ control, patchField }: OnboardingStepProps) {
  return (
    <View className="items-center gap-5">
      <IconBadge icon="home-variant-outline" />
      <StepIntro title="Name your personal vault" subtitle="This is how it will appear in your app." centered />
      <View className="w-full">
        <FormField label="Vault name">
          <Controller
            control={control}
            name="vaultName"
            render={({ field: { onBlur, value } }) => (
              <TextInput
                autoCapitalize="words"
                className="h-12 rounded-md border border-state-success bg-background px-4 font-sans text-base text-text"
                onBlur={onBlur}
                onChangeText={(text) => patchField("vaultName", text)}
                placeholder="Personal vault"
                placeholderTextColor={theme.colors.text.muted}
                value={value}
              />
            )}
          />
        </FormField>
      </View>
    </View>
  );
}
