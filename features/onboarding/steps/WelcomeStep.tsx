import { Text, View } from "react-native";

import { FeaturePill, IconHero } from "@/features/onboarding/steps/stepUi";

export function WelcomeStep() {
  return (
    <View className="items-center gap-5">
      <IconHero icon="safe-square-outline" />
      <View className="gap-3">
        <Text className="text-center font-sans text-2xl font-bold text-text">Your money deserves a home.</Text>
        <Text className="text-center font-sans text-sm text-text-muted">
          Private, beautiful, and built around the way you manage your finances.
        </Text>
      </View>
      <FeaturePill icon="shield-check-outline" label="Encrypted session" />
    </View>
  );
}
