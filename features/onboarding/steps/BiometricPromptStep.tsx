import { Text, View } from "react-native";

import { IconBadge, StepIntro } from "@/features/onboarding/steps/stepUi";

export function BiometricPromptStep() {
  return (
    <View className="items-center gap-5">
      <IconBadge icon="fingerprint" />
      <StepIntro
        centered
        subtitle="Unlock Money Vault faster on this device. You can always enable this later in Settings."
        title="Would you like to enable fingerprint unlock?"
      />
      <Text className="text-center font-sans text-sm text-text-muted">This is optional and stays on your device.</Text>
    </View>
  );
}
