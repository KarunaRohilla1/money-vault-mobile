import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { goBackOrReplace } from "@/lib/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import { apiClient, ApiClientError } from "@/services/api/client";
import { sessionExtras } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

export function CreateSharedVaultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const [vaultName, setVaultName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No authenticated session.");
      }

      const trimmedName = vaultName.trim();
      if (!trimmedName) {
        throw new Error("Vault name is required.");
      }

      return apiClient.createSharedVault(token, {
        vaultName: trimmedName
      });
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Shared vault could not be created. Try again.");
      }
    },
    onSuccess: (response) => {
      setError(null);
      setInviteCode(response.inviteCode ?? null);
      showToast("Shared vault created successfully!");
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault, sessionExtras(response));
      void queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
    }
  });

  const handleCreate = () => {
    setError(null);
    createMutation.mutate();
  };

  const isLoading = createMutation.isPending;
  const hasError = error !== null;
  const hasInviteCode = inviteCode !== null;

  const copyInviteCode = async () => {
    if (!inviteCode) {
      return;
    }
    await Clipboard.setStringAsync(inviteCode);
    showToast("Invite code copied.");
  };

  const shareInviteCode = async () => {
    if (!inviteCode) {
      return;
    }
    await Share.share({
      message: `Join my Money Vault shared vault with invite code: ${inviteCode}`
    });
  };

  return (
    <Screen contentClassName="gap-0 px-0 pb-28">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pt-4">
          <View className="relative items-center gap-3 pt-2">
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
              onPress={() => goBackOrReplace(router, "/settings/shared-vault")}
            >
              <MaterialCommunityIcons name="arrow-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
            </Pressable>
            <View className="items-center gap-1">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
                <MaterialCommunityIcons name="plus-circle" size={theme.icons.lg} color={theme.colors.brand.soft} />
              </View>
              <Text className="font-sans text-3xl font-bold text-text">Create Shared Vault</Text>
              <Text className="font-sans text-sm text-text-muted">Set up a new vault to share expenses</Text>
            </View>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="font-sans text-sm font-semibold text-text">Vault Name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="off"
                className="rounded-lg border border-surface-border bg-background px-4 py-3 font-sans text-base text-text placeholder:text-text-muted"
                editable={!isLoading}
                onChangeText={setVaultName}
                placeholder="e.g., Apartment, Household"
                placeholderTextColor={theme.colors.text.muted}
                value={vaultName}
              />
            </View>

            {hasError ? (
              <View className="gap-2 rounded-lg bg-state-danger/10 px-4 py-3">
                <Text className="font-sans text-sm text-state-danger">{error}</Text>
              </View>
            ) : null}

            {hasInviteCode ? (
              <View className="gap-3 rounded-lg border border-surface-border bg-surface-muted px-4 py-4">
                <Text className="font-sans text-sm font-semibold text-text">Invite Code</Text>
                <Text selectable className="font-sans text-2xl font-bold tracking-widest text-brand-soft">
                  {inviteCode}
                </Text>
                <View className="flex-row gap-3">
                  <SecondaryButton className="flex-1" onPress={copyInviteCode}>
                    Copy
                  </SecondaryButton>
                  <SecondaryButton className="flex-1" onPress={shareInviteCode}>
                    Share
                  </SecondaryButton>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-surface-border bg-background px-5 py-4">
        <PrimaryButton disabled={isLoading} loading={isLoading} onPress={hasInviteCode ? () => router.replace("/settings/shared-vault" as never) : handleCreate}>
          {hasInviteCode ? "Done" : "Create Vault"}
        </PrimaryButton>
        <SecondaryButton className="mt-3" disabled={isLoading} onPress={() => goBackOrReplace(router, "/settings/shared-vault")}>
          Cancel
        </SecondaryButton>
      </View>
    </Screen>
  );
}
