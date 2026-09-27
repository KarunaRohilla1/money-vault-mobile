import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ApiClientError } from "@/services/api/client";
import { recoverPin, sessionExtras } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

export function ForgotPinScreen() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!recoveryCode.trim()) {
      setError("Recovery code is required.");
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      setError("PIN must be between 4 and 6 characters.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const session = await recoverPin({
        confirmPin,
        newPin,
        recoveryCode: recoveryCode.trim(),
        username: username.trim()
      });
      setAuthenticated(session.token, session.vault, session.authenticatedVault, sessionExtras(session));
    } catch (caught) {
      if (caught instanceof ApiClientError && (caught.status === 401 || caught.code === "INVALID_RECOVERY_CODE")) {
        setError("Recovery code is invalid.");
      } else {
        setError(caught instanceof Error ? caught.message : "We couldn't reset your PIN. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentClassName="flex-1 justify-center gap-6">
      <View className="gap-2">
        <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Money Vault</Text>
        <Text className="font-sans text-2xl font-bold text-text">Reset your PIN</Text>
        <Text className="font-sans text-sm text-text-muted">
          Enter your username and recovery code to create a new PIN. Your vault and data stay intact.
        </Text>
      </View>

      <View className="gap-4 rounded-lg border border-surface-border bg-surface p-5">
        <FormField label="Username">
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            onChangeText={setUsername}
            placeholder="your_username"
            placeholderTextColor={theme.colors.text.subtle}
            value={username}
          />
        </FormField>
        <FormField label="Recovery code">
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            onChangeText={setRecoveryCode}
            placeholder="XXXX-XXXX-XXXX"
            placeholderTextColor={theme.colors.text.subtle}
            value={recoveryCode}
          />
        </FormField>
        <FormField label="New PIN">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setNewPin}
            placeholder="Enter new PIN"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={newPin}
          />
        </FormField>
        <FormField error={error ?? undefined} label="Confirm new PIN">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setConfirmPin}
            placeholder="Confirm new PIN"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={confirmPin}
          />
        </FormField>
        <PrimaryButton disabled={submitting} loading={submitting} onPress={() => void submit()}>
          Reset PIN
        </PrimaryButton>
        <SecondaryButton onPress={() => router.replace("/welcome" as Href)}>Back</SecondaryButton>
      </View>
    </Screen>
  );
}
