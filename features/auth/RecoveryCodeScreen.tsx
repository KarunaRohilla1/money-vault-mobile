import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton } from "@/components/ui";
import { useRecoveryCodeStore } from "@/stores/recoveryCodeStore";
import { theme } from "@/theme";

export function RecoveryCodeScreen() {
  const pendingCode = useRecoveryCodeStore((state) => state.pendingCode);
  const clearPendingCode = useRecoveryCodeStore((state) => state.clearPendingCode);
  const [confirmed, setConfirmed] = useState(false);
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
    if (!pendingCode) {
      return;
    }

    await Clipboard.setStringAsync(pendingCode);
    setCopied(true);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimeoutRef.current = null;
    }, 2000);
  }

  if (!pendingCode) {
    return null;
  }

  return (
    <Screen contentClassName="flex-1 justify-center gap-6" scroll={false}>
      <View className="gap-2">
        <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Money Vault</Text>
        <Text className="font-sans text-2xl font-bold text-text">Save your recovery code</Text>
        <Text className="font-sans text-sm text-text-muted">
          If you forget your PIN, this code is the only way to reset it. Store it somewhere safe. It will not be shown
          again.
        </Text>
      </View>

      <View className="items-center gap-3 rounded-lg border border-surface-border bg-surface p-5">
        <View className="w-full flex-row items-center gap-3">
          <Text className="min-w-0 flex-1 text-center font-sans text-2xl font-bold tracking-widest text-text">
            {pendingCode}
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
        {copied ? <Text className="font-sans text-sm font-semibold text-brand-soft">Copied!</Text> : null}
      </View>

      <PrimaryButton
        disabled={confirmed}
        onPress={() => {
          setConfirmed(true);
          clearPendingCode();
        }}
      >
        I have saved my recovery code
      </PrimaryButton>
    </Screen>
  );
}
