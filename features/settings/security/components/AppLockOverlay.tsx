import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { resetNavigationAfterLogout } from "@/features/settings/logoutNavigation";
import { SECURITY_COPY, SECURITY_MESSAGES } from "@/features/settings/security/constants/security";
import { isBiometricUnlockEnabled } from "@/features/settings/security/services/appLock.service";
import { authenticateWithBiometrics } from "@/features/settings/security/services/biometric.service";
import { hasLocalPin, verifyLocalPin } from "@/features/settings/security/services/pinLock.service";
import { logoutBackendSession } from "@/services/api/logout";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

interface AppLockOverlayProps {
  onPromptingChange?: (prompting: boolean) => void;
  onUnlocked: () => void;
}

export function AppLockOverlay({ onPromptingChange, onUnlocked }: AppLockOverlayProps) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pin, setPin] = useState("");
  const [pinAvailable, setPinAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const attemptedRef = useRef(false);

  function finishUnlock() {
    onUnlocked();
  }

  async function unlockWithBiometrics() {
    if (unlocking || leaving) {
      return;
    }

    setUnlocking(true);
    setError(null);
    onPromptingChange?.(true);

    try {
      const result = await authenticateWithBiometrics("Unlock Money Vault");

      if (result.status === "success") {
        await finishUnlock();
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

  async function unlockWithPin() {
    if (unlocking || leaving) {
      return;
    }

    setUnlocking(true);
    setError(null);
    try {
      const matches = await verifyLocalPin(pin, userId);
      if (!matches) {
        setError("That PIN isn't correct. Try again.");
        return;
      }
      await finishUnlock();
    } finally {
      setUnlocking(false);
    }
  }

  async function leaveLockedSession(destination: "/welcome" | "/forgot-pin" = "/welcome") {
    if (unlocking || leaving) {
      return;
    }

    setLeaving(true);
    setError(null);
    onPromptingChange?.(true);

    try {
      await logoutBackendSession();
      onUnlocked();
      if (destination === "/forgot-pin") {
        router.replace("/forgot-pin" as never);
      } else {
        resetNavigationAfterLogout(router);
      }
    } catch {
      setError(SECURITY_MESSAGES.unexpectedError);
    } finally {
      onPromptingChange?.(false);
      setLeaving(false);
    }
  }

  useEffect(() => {
    void hasLocalPin(userId).then(setPinAvailable);
  }, [userId]);

  useEffect(() => {
    void isBiometricUnlockEnabled(userId).then((enabled) => {
      setBiometricEnabled(enabled);
      if (enabled && !attemptedRef.current) {
        attemptedRef.current = true;
        void unlockWithBiometrics();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const subtitleText = biometricEnabled
    ? "Unlock with biometrics or your Money Vault PIN."
    : "Unlock with your Money Vault PIN.";
  const busy = unlocking || leaving;

  return (
    <SafeAreaView className="absolute inset-0 z-50 bg-background" edges={["top", "right", "bottom", "left"]}>
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="lock-outline" size={40} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-center font-sans text-2xl font-bold text-text" maxFontSizeMultiplier={1.3}>
            {SECURITY_COPY.unlockTitle}
          </Text>
          <Text className="text-center font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
            {subtitleText}
          </Text>
        </View>
        {error ? (
          <Text className="text-center font-sans text-sm font-semibold text-state-danger" maxFontSizeMultiplier={1.3}>
            {error}
          </Text>
        ) : null}
        {pinAvailable ? (
          <TextInput
            accessibilityLabel="PIN"
            className="h-12 w-full rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setPin}
            placeholder="Enter PIN"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={pin}
          />
        ) : null}
        {biometricEnabled ? (
          <>
            <PrimaryButton className="min-w-48" disabled={leaving} loading={unlocking} onPress={() => void unlockWithBiometrics()}>
              Unlock
            </PrimaryButton>
            {pinAvailable ? (
              <SecondaryButton className="min-w-48" disabled={busy} onPress={() => void unlockWithPin()}>
                Unlock with PIN
              </SecondaryButton>
            ) : null}
          </>
        ) : pinAvailable ? (
          <PrimaryButton className="min-w-48" disabled={leaving} loading={unlocking} onPress={() => void unlockWithPin()}>
            Unlock with PIN
          </PrimaryButton>
        ) : null}
        <View className="mt-2 items-center gap-3">
          <Pressable
            accessibilityLabel={SECURITY_COPY.forgotPin}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void leaveLockedSession("/forgot-pin")}
          >
            <Text className="font-sans text-sm font-semibold text-accent-gold">{SECURITY_COPY.forgotPin}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={SECURITY_COPY.useAnotherAccount}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void leaveLockedSession("/welcome")}
          >
            <Text className="font-sans text-sm font-semibold text-text-muted">{SECURITY_COPY.useAnotherAccount}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
