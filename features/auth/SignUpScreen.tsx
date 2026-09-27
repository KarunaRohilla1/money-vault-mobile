import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ApiClientError } from "@/services/api/client";
import { registerWithUsernamePin, sessionExtras } from "@/services/api/session";
import { registrationError } from "@/services/auth/credentials";
import { useAuthStore } from "@/stores/authStore";
import { useRecoveryCodeStore } from "@/stores/recoveryCodeStore";
import { theme } from "@/theme";

export function SignUpScreen() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setPendingCode = useRecoveryCodeStore((state) => state.setPendingCode);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const validation = registrationError({ confirmPin, displayName, pin, username });
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const session = await registerWithUsernamePin({
        confirmPin,
        displayName,
        pin,
        username
      });
      if (session.recoveryCode) {
        setPendingCode(session.recoveryCode);
      }
      setAuthenticated(session.token, session.vault, session.authenticatedVault, sessionExtras(session));
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        setError(caught.message);
      } else {
        setError("We couldn't create your account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentClassName="flex-1 justify-center gap-6">
      <View className="gap-2">
        <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Money Vault</Text>
        <Text className="font-sans text-2xl font-bold text-text">Create your Money Vault</Text>
        <Text className="font-sans text-sm text-text-muted">
          Remember your username and PIN. They are how you sign in to Money Vault.
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
        <FormField label="Display Name">
          <TextInput
            autoCapitalize="words"
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.text.subtle}
            value={displayName}
          />
        </FormField>
        <FormField label="PIN">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setPin}
            placeholder="4 to 6 digits"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={pin}
          />
        </FormField>
        <FormField error={error ?? undefined} label="Confirm PIN">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setConfirmPin}
            placeholder="Confirm PIN"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={confirmPin}
          />
        </FormField>
        <PrimaryButton disabled={submitting} loading={submitting} onPress={() => void submit()}>
          Create account
        </PrimaryButton>
        <SecondaryButton onPress={() => router.replace("/welcome" as Href)}>Back</SecondaryButton>
      </View>
    </Screen>
  );
}
