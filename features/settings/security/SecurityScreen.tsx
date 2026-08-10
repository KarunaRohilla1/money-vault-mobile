import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { AuthenticationCard } from "@/features/settings/security/components/AuthenticationCard";
import { AutoLockCard } from "@/features/settings/security/components/AutoLockCard";
import { AutoLockSheet } from "@/features/settings/security/components/AutoLockSheet";
import { PinCard } from "@/features/settings/security/components/PinCard";
import { SecurityInfoCard } from "@/features/settings/security/components/SecurityInfoCard";
import {
  SECURITY_COPY,
  SECURITY_MESSAGES,
  type AutoLockTimeout
} from "@/features/settings/security/constants/security";
import { useAutoLock } from "@/features/settings/security/hooks/useAutoLock";
import { useBiometric } from "@/features/settings/security/hooks/useBiometric";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import { theme } from "@/theme";

export function SecurityScreen() {
  const router = useRouter();
  const biometric = useBiometric();
  const autoLock = useAutoLock();
  const [autoLockSheetVisible, setAutoLockSheetVisible] = useState(false);

  async function handleBiometricToggle(next: boolean) {
    if (next) {
      const result = await biometric.enable();

      if (result.status === "unsupported") {
        showToast(SECURITY_MESSAGES.biometricUnsupported);
        return;
      }

      if (result.status === "error" || result.status === "failed") {
        showToast(result.message);
      }

      return;
    }

    const result = await biometric.disable();

    if (result.status === "error") {
      showToast(result.message);
    }
  }

  async function handleAutoLockSelect(timeout: AutoLockTimeout) {
    setAutoLockSheetVisible(false);
    const result = await autoLock.setTimeout(timeout);

    if (result.status === "error") {
      showToast(result.message);
    }
  }

  return (
    <Screen contentClassName="gap-6 px-5 pb-28 pt-4">
      <View className="relative items-center gap-3 pt-2">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, "/more")}
        >
          <MaterialCommunityIcons color={theme.colors.text.DEFAULT} name="arrow-left" size={theme.icons.md} />
        </Pressable>

        <View className="h-16 w-16 items-center justify-center">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="shield-lock-outline" size={48} />
        </View>

        <Text className="font-sans text-3xl font-bold text-text" maxFontSizeMultiplier={1.3}>
          {SECURITY_COPY.screenTitle}
        </Text>
        <Text className="px-6 text-center font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
          {SECURITY_COPY.screenDescription}
        </Text>
      </View>

      <AuthenticationCard
        disabled={biometric.isLoading || biometric.isUpdating}
        enabled={biometric.enabled}
        onValueChange={(next) => {
          void handleBiometricToggle(next);
        }}
      />

      <AutoLockCard
        currentLabel={autoLock.currentLabel}
        disabled={autoLock.isLoading || autoLock.isUpdating}
        onPress={() => setAutoLockSheetVisible(true)}
      />

      <PinCard onPress={() => router.push("/settings/change-pin" as never)} />

      <SecurityInfoCard />

      <AutoLockSheet
        onClose={() => setAutoLockSheetVisible(false)}
        onSelect={(timeout) => {
          void handleAutoLockSelect(timeout);
        }}
        selected={autoLock.currentTimeout}
        visible={autoLockSheetVisible}
      />
    </Screen>
  );
}
