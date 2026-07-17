import { View } from "react-native";

import { FeaturePill, IconHero, StepIntro } from "@/features/onboarding/steps/stepUi";

export function FinishStep() {
  return (
    <View className="items-center gap-5">
      <IconHero icon="check-circle-outline" success />
      <StepIntro title="Your vault is ready." subtitle="Let's take you to your dashboard." centered />
      <View className="w-full gap-3">
        <FeaturePill icon="cash-multiple" label="Track income and expenses" />
        <FeaturePill icon="calendar-range" label="Plan your monthly cycle" />
        <FeaturePill icon="account-group-outline" label="Split and settle shared expenses" />
        <FeaturePill icon="bullseye-arrow" label="Reach your savings goals" />
      </View>
    </View>
  );
}
