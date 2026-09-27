import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { SECURITY_COPY } from "@/features/settings/security/constants/security";
import { ApiClientError } from "@/services/api/client";
import { loginWithUsernamePin, sessionExtras } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

export function SignInScreen() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!pin) {
      setError("PIN is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const session = await loginWithUsernamePin(username, pin);
      setAuthenticated(session.token, session.vault, session.authenticatedVault, sessionExtras(session));
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 401) {
        setError("Username or PIN is incorrect.");
      } else {
        setError(caught instanceof Error ? caught.message : "We couldn't sign you in. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen contentClassName="flex-1 justify-center gap-6" scroll={false}>
      <View className="gap-2">
        <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">Money Vault</Text>
        <Text className="font-sans text-2xl font-bold text-text">Welcome back</Text>
        <Text className="font-sans text-sm text-text-muted">Sign in with your username and PIN.</Text>
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
        <FormField error={error ?? undefined} label="PIN">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background-muted px-4 font-sans text-base text-text"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setPin}
            placeholder="Enter PIN"
            placeholderTextColor={theme.colors.text.subtle}
            secureTextEntry
            value={pin}
          />
        </FormField>
        <Pressable
          accessibilityLabel={SECURITY_COPY.forgotPin}
          accessibilityRole="button"
          onPress={() => router.push("/forgot-pin" as Href)}
        >
          <Text className="font-sans text-sm font-semibold text-accent-gold">{SECURITY_COPY.forgotPin}</Text>
        </Pressable>
        <PrimaryButton disabled={submitting} loading={submitting} onPress={() => void submit()}>
          Sign in
        </PrimaryButton>
        <SecondaryButton onPress={() => router.replace("/welcome" as Href)}>Back</SecondaryButton>
      </View>
    </Screen>
  );
}
