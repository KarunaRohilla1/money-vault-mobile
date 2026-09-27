import { Screen } from "@/components/layout/Screen";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { goBackOrReplace } from "@/lib/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import { apiClient, ApiClientError } from "@/services/api/client";
import { sessionExtras } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function JoinSharedVaultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No authenticated session.");
      }

      const trimmedCode = inviteCode.trim();
      if (!trimmedCode) {
        throw new Error("Invite code is required.");
      }

      return apiClient.joinSharedVault(token, {
        inviteCode: trimmedCode
      });
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not join shared vault. Try again.");
      }
    },
    onSuccess: (response) => {
      setError(null);
      showToast("Successfully joined shared vault!");
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault, sessionExtras(response));
      void queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
      router.replace("/settings/shared-vault" as never);
    }
  });

  const handleJoin = () => {
    setError(null);
    joinMutation.mutate();
  };

  const isLoading = joinMutation.isPending;
  const hasError = error !== null;

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
                <MaterialCommunityIcons name="link-variant" size={theme.icons.lg} color={theme.colors.brand.soft} />
              </View>
              <Text className="font-sans text-3xl font-bold text-text">Join Shared Vault</Text>
              <Text className="font-sans text-sm text-text-muted">Enter your invite code to join</Text>
            </View>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="font-sans text-sm font-semibold text-text">Invite Code</Text>
              <TextInput
                autoCapitalize="characters"
                autoComplete="off"
                className="rounded-lg border border-surface-border bg-background px-4 py-3 font-sans text-base text-text placeholder:text-text-muted"
                editable={!isLoading}
                onChangeText={setInviteCode}
                placeholder="Enter your invite code"
                placeholderTextColor={theme.colors.text.muted}
                value={inviteCode}
              />
              <Text className="font-sans text-xs text-text-muted">Ask the vault owner for the invite code to join their shared vault.</Text>
            </View>

            {hasError ? (
              <View className="gap-2 rounded-lg bg-state-danger/10 px-4 py-3">
                <Text className="font-sans text-sm text-state-danger">{error}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-surface-border bg-background px-5 py-4">
        <PrimaryButton disabled={isLoading} loading={isLoading} onPress={handleJoin}>
          Join Vault
        </PrimaryButton>
        <SecondaryButton className="mt-3" disabled={isLoading} onPress={() => goBackOrReplace(router, "/settings/shared-vault")}>
          Cancel
        </SecondaryButton>
      </View>
    </Screen>
  );
}
