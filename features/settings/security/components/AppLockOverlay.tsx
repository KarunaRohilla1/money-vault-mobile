import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/ui";
import { SECURITY_COPY, SECURITY_MESSAGES } from "@/features/settings/security/constants/security";
import { authenticateWithBiometrics } from "@/features/settings/security/services/biometric.service";
import { theme } from "@/theme";

interface AppLockOverlayProps {
  onPromptingChange?: (prompting: boolean) => void;
  onUnlocked: () => void;
}

export function AppLockOverlay({ onPromptingChange, onUnlocked }: AppLockOverlayProps) {
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const attemptedRef = useRef(false);

  async function unlock() {
    if (unlocking) {
      return;
    }

    setUnlocking(true);
    setError(null);
    onPromptingChange?.(true);

    try {
      const result = await authenticateWithBiometrics("Unlock Money Vault");

      if (result.status === "success") {
        onUnlocked();
        return;
      }

      if (result.status === "cancelled") {
        setError(SECURITY_MESSAGES.biometricCancelled);
        return;
      }

      setError(result.message ?? SECURITY_MESSAGES.biometricFailed);
    } finally {
      onPromptingChange?.(false);
      setUnlocking(false);
    }
  }

  useEffect(() => {
    if (attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;
    void unlock();
    // Auto-prompt once when the lock overlay appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView className="absolute inset-0 z-50 bg-background" edges={["top", "right", "bottom", "left"]}>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="fingerprint" size={40} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-center font-sans text-2xl font-bold text-text" maxFontSizeMultiplier={1.3}>
            {SECURITY_COPY.screenTitle}
          </Text>
          <Text className="text-center font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
            Unlock with your fingerprint or Face ID to continue.
          </Text>
        </View>
        {error ? (
          <Text className="text-center font-sans text-sm font-semibold text-state-danger" maxFontSizeMultiplier={1.3}>
            {error}
          </Text>
        ) : null}
        <PrimaryButton className="min-w-48" loading={unlocking} onPress={() => void unlock()}>
          Unlock
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}
