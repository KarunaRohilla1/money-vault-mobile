import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { SwitchSharedVaultSheet } from "@/features/settings/SwitchSharedVaultSheet";
import {
  sharedVaultMemberCountLabel,
  sharedVaultRoleLabel,
  sharedVaultsForSwitch
} from "@/features/settings/sharedVaultModel";
import { isSharedVault } from "@/features/settings/moreModel";
import type { IconName } from "@/constants/navigation";
import { goBackOrReplace } from "@/lib/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import { apiClient, ApiClientError } from "@/services/api/client";
import { activatePersonalVaultSession, activateSharedVaultSession, sessionExtras } from "@/services/api/session";
import type { SharedVaultSummaryApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

function SharedVaultOption({
  description,
  icon,
  onPress,
  title
}: {
  description: string;
  icon: IconName;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-xl border border-surface-border bg-surface-muted p-4"
      onPress={onPress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text">{title}</Text>
        <Text className="font-sans text-sm text-text-muted">{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={theme.icons.md} color={theme.colors.text.muted} />
    </Pressable>
  );
}

function SharedVaultMembershipCard({
  activeVaultId,
  onManage,
  onSwitch,
  switching,
  vault
}: {
  activeVaultId: string | null;
  onManage: () => void;
  onSwitch: () => void;
  switching: boolean;
  vault: SharedVaultSummaryApi;
}) {
  const isActive = activeVaultId === String(vault.id);

  return (
    <View className="gap-4 rounded-xl border border-brand-muted bg-surface p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons name="account-group" size={theme.icons.md} color={theme.colors.brand.soft} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-sans text-lg font-bold text-text" numberOfLines={1}>
            {vault.name}
          </Text>
          <Text className="font-sans text-sm text-text-muted">
            {sharedVaultMemberCountLabel(vault.memberCount)} · {sharedVaultRoleLabel(vault.role)}
          </Text>
          {isActive ? (
            <View className="mt-1 self-start rounded-md bg-brand-deep px-2 py-1">
              <Text className="font-sans text-xs font-bold text-brand-soft">Active</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View className="flex-row gap-3">
        <SecondaryButton className="flex-1" disabled={switching || isActive} onPress={onSwitch}>
          {switching ? "Switching..." : isActive ? "Active" : "Switch Vault"}
        </SecondaryButton>
        <PrimaryButton className="flex-1" onPress={onManage}>
          Manage
        </PrimaryButton>
      </View>
    </View>
  );
}

export function SharedVaultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const activeVault = useAuthStore((state) => state.vault);
  const authenticatedVault = useAuthStore((state) => state.authenticatedVault);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<number | string | null>(null);
  const [switchingVaultId, setSwitchingVaultId] = useState<number | string | null>(null);

  const sharedVaultsQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => apiClient.getSharedVaults(token ?? ""),
    queryKey: queryKeys.vaults.shared
  });

  const vaults = useMemo(() => sharedVaultsForSwitch(sharedVaultsQuery.data ?? []), [sharedVaultsQuery.data]);

  const switchMutation = useMutation({
    mutationFn: async (targetVaultId: number | string) => {
      if (!token) {
        throw new Error("No authenticated session.");
      }
      if (String(targetVaultId) === String(authenticatedVault?.id) || targetVaultId === "personal") {
        return activatePersonalVaultSession(token);
      }
      return activateSharedVaultSession(token, { sharedVaultId: Number(targetVaultId) });
    },
    onError: () => {
      setSwitchingVaultId(null);
      showToast("Vault could not be switched. Try again.");
    },
    onSuccess: (response) => {
      setSwitchingVaultId(null);
      setPickerVisible(false);
      setSelectedVaultId(null);
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault, sessionExtras(response));
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.effective(response.vault.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
      showToast(`Switched to ${response.vault.name}`);
      router.replace("/");
    }
  });

  const handleSwitchVault = (vault: SharedVaultSummaryApi) => {
    if (String(vault.id) === activeVault?.id && isSharedVault(activeVault)) {
      return;
    }

    setSelectedVaultId(vault.id);
    setPickerVisible(true);
  };

  const handleCreatePress = () => {
    router.push("/settings/shared-vault/create" as never);
  };

  const handleJoinPress = () => {
    router.push("/settings/shared-vault/join" as never);
  };

  return (
    <Screen
      contentClassName="gap-6 px-5 pb-28 pt-4"
      onRefresh={() => sharedVaultsQuery.refetch()}
      refreshing={sharedVaultsQuery.isRefetching}
    >
      <View className="relative items-center gap-3 pt-2">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, "/more")}
        >
          <MaterialCommunityIcons name="arrow-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <View className="items-center gap-1">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
            <MaterialCommunityIcons name="account-group" size={theme.icons.lg} color={theme.colors.brand.soft} />
          </View>
          <Text className="font-sans text-3xl font-bold text-text">Shared Vault</Text>
          <Text className="font-sans text-sm text-text-muted">Manage, create, or join shared vaults</Text>
        </View>
      </View>

      {sharedVaultsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {sharedVaultsQuery.isError ? (
        <ErrorView
          message={
            sharedVaultsQuery.error instanceof ApiClientError
              ? sharedVaultsQuery.error.message
              : "Shared vaults could not be loaded."
          }
          onRetry={() => sharedVaultsQuery.refetch()}
        />
      ) : null}

      {vaults.length > 0 ? (
        <View className="gap-3">
          <Text className="font-sans text-sm font-bold uppercase text-text-muted">Your Shared Vaults</Text>
          {vaults.map((vault) => (
            <SharedVaultMembershipCard
              activeVaultId={activeVault?.id ?? null}
              key={vault.id}
              onManage={() => router.push(`/settings/shared-vault/manage/${vault.id}` as never)}
              onSwitch={() => handleSwitchVault(vault)}
              switching={switchMutation.isPending && switchingVaultId === vault.id}
              vault={vault}
            />
          ))}
        </View>
      ) : null}

      <View className="gap-3">
        {vaults.length > 0 ? (
          <Text className="font-sans text-sm font-bold uppercase text-text-muted">Add another</Text>
        ) : null}
        <SharedVaultOption
          icon="plus-circle-outline"
          title="Create Shared Vault"
          description="Create a new shared vault and invite members."
          onPress={handleCreatePress}
        />
        <SharedVaultOption
          icon="link-variant"
          title="Join Shared Vault"
          description="Join an existing shared vault with an invite code."
          onPress={handleJoinPress}
        />
      </View>

      <SwitchSharedVaultSheet
        activeVaultId={activeVault?.id}
        isSharedActive={isSharedVault(activeVault)}
        onCancel={() => {
          if (!switchMutation.isPending) {
            setPickerVisible(false);
            setSelectedVaultId(null);
          }
        }}
        onConfirm={() => {
          if (selectedVaultId == null) {
            return;
          }
          setSwitchingVaultId(selectedVaultId);
          switchMutation.mutate(selectedVaultId);
        }}
        onSelect={setSelectedVaultId}
        personalVault={authenticatedVault ? { id: authenticatedVault.id, name: authenticatedVault.name } : null}
        selectedVaultId={selectedVaultId}
        switching={switchMutation.isPending}
        vaults={vaults}
        visible={pickerVisible}
      />
    </Screen>
  );
}
