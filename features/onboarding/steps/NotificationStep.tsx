import { View } from "react-native";

import { SecondaryButton } from "@/components/ui";
import type { OnboardingStepProps } from "@/features/onboarding/hooks/useOnboardingFlow";
import { FeaturePill, IconHero, StepIntro } from "@/features/onboarding/steps/stepUi";

export function NotificationStep({ patchField, values }: OnboardingStepProps) {
  return (
    <View className="items-center gap-5">
      <IconHero icon="bell-ring-outline" />
      <StepIntro title="Never miss what matters" subtitle="Get reminders for bills, commitments, and important updates." centered />
      <View className="w-full gap-3">
        <FeaturePill icon="calendar-check-outline" label="Bill due dates" />
        <FeaturePill icon="clock-alert-outline" label="Obligation reminders" />
        <FeaturePill icon="chart-line" label="Spending insights" />
      </View>
      <View className="flex-row gap-3">
        <SecondaryButton
          className={values.notificationsEnabled === true ? "border-brand-soft" : undefined}
          onPress={() => patchField("notificationsEnabled", true)}
        >
          Allow reminders
        </SecondaryButton>
        <SecondaryButton
          className={values.notificationsEnabled === false ? "border-brand-soft" : undefined}
          onPress={() => patchField("notificationsEnabled", false)}
        >
          Skip
        </SecondaryButton>
      </View>
    </View>
  );
}
