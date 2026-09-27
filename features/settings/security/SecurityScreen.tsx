import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton } from "@/components/ui";
import { AuthenticationCard } from "@/features/settings/security/components/AuthenticationCard";
import { AutoLockCard } from "@/features/settings/security/components/AutoLockCard";
import { AutoLockSheet } from "@/features/settings/security/components/AutoLockSheet";
import { PinCard } from "@/features/settings/security/components/PinCard";
import { RecoveryCodeCard } from "@/features/settings/security/components/RecoveryCodeCard";
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
import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

export function SecurityScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const biometric = useBiometric();
  const autoLock = useAutoLock();
  const [autoLockSheetVisible, setAutoLockSheetVisible] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [generatingRecovery, setGeneratingRecovery] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  async function copyRecoveryCode() {
    if (!recoveryCode) {
      return;
    }
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = null;
    }, 2000);
  }

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

  async function handleGenerateRecoveryCode() {
    if (!token || generatingRecovery) {
      return;
    }

    setGeneratingRecovery(true);
    try {
      const response = await apiClient.createRecoveryCode(token);
      setRecoveryCode(response.recoveryCode);
    } catch {
      showToast(SECURITY_MESSAGES.unexpectedError);
    } finally {
      setGeneratingRecovery(false);
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

      <RecoveryCodeCard onPress={() => void handleGenerateRecoveryCode()} />

      <SecurityInfoCard />

      <AutoLockSheet
        onClose={() => setAutoLockSheetVisible(false)}
        onSelect={(timeout) => {
          void handleAutoLockSelect(timeout);
        }}
        selected={autoLock.currentTimeout}
        visible={autoLockSheetVisible}
      />

      <Modal animationType="fade" transparent visible={Boolean(recoveryCode)} onRequestClose={() => setRecoveryCode(null)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full gap-5 rounded-lg border border-surface-border bg-background p-5">
            <Text className="font-sans text-xl font-bold text-text">Save your new recovery code</Text>
            <Text className="font-sans text-sm text-text-muted">
              Your previous recovery code no longer works. Store this code somewhere safe — it will not be shown again.
            </Text>
            <View className="w-full flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface p-4">
              <Text className="min-w-0 flex-1 text-center font-sans text-2xl font-bold tracking-widest text-text">
                {recoveryCode}
              </Text>
              <Pressable
                accessibilityLabel="Copy recovery code"
                accessibilityRole="button"
                className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
                onPress={() => void copyRecoveryCode()}
              >
                <MaterialCommunityIcons
                  color={theme.colors.brand.soft}
                  name={copied ? "check" : "content-copy"}
                  size={theme.icons.md}
                />
              </Pressable>
            </View>
            {copied ? <Text className="text-center font-sans text-sm font-semibold text-brand-soft">Copied!</Text> : null}
            <PrimaryButton onPress={() => setRecoveryCode(null)}>I have saved my recovery code</PrimaryButton>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
