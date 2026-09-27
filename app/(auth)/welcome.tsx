import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { IconHero } from "@/features/onboarding/steps/stepUi";

export default function WelcomeRoute() {
  const router = useRouter();

  return (
    <Screen contentClassName="flex-1 justify-center gap-8" scroll={false}>
      <View className="items-center gap-4">
        <IconHero icon="safe-square-outline" />
        <View className="gap-2">
          <Text className="text-center font-sans text-xs font-semibold uppercase text-accent-gold">Money Vault</Text>
          <Text className="text-center font-sans text-3xl font-bold text-text">Your money, beautifully kept.</Text>
          <Text className="text-center font-sans text-sm text-text-muted">
            Private, beautiful, and built around the way you manage your finances.
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <PrimaryButton onPress={() => router.push("/sign-up" as Href)}>Create account</PrimaryButton>
        <SecondaryButton onPress={() => router.push("/sign-in" as Href)}>Sign in</SecondaryButton>
      </View>
    </Screen>
  );
}
