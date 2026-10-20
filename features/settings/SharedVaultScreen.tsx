import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, ErrorView, LoadingSkeleton } from "@/components/ui";
import { useClearPrimarySharedVaultMutation, usePrimarySharedVaultQuery, useSetPrimarySharedVaultMutation } from "@/features/settings/api";
import {
  isPrimarySharedVaultNone,
  primarySharedVaultOptions,
  selectedPrimarySharedVaultOption,
  type PrimarySharedVaultOption,
  type PrimarySharedVaultOptionId
} from "@/features/settings/primarySharedVaultModel";
import {
  sharedVaultListStatusBadges,
  sharedVaultMemberCountLabel,
  sharedVaultRoleLabel,
  sharedVaultsForSwitch
} from "@/features/settings/sharedVaultModel";
import type { IconName } from "@/constants/navigation";
import { goBackOrReplace } from "@/lib/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import { apiClient, ApiClientError } from "@/services/api/client";
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

function SharedVaultStatusBadge({ label, tone }: { label: string; tone: "brand" | "muted" }) {
  return (
    <View className={`rounded-md px-2 py-0.5 ${tone === "brand" ? "bg-brand-deep" : "bg-background-muted"}`}>
      <Text className={`font-sans text-xs font-bold ${tone === "brand" ? "text-brand-soft" : "text-text-muted"}`}>{label}</Text>
    </View>
  );
}

function SharedVaultMembershipCard({
  isPrimary,
  onPress,
  vault
}: {
  isPrimary: boolean;
  onPress: () => void;
  vault: SharedVaultSummaryApi;
}) {
  const badges = sharedVaultListStatusBadges({
    includeInSafeToSpend: vault.includeInSafeToSpend,
    isPrimary,
    showOnDashboard: vault.showOnDashboard
  });

  return (
    <Pressable
      accessibilityHint="Opens vault details"
      accessibilityLabel={vault.name}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-3"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name="account-group" size={theme.icons.md} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
          {vault.name}
        </Text>
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
          {sharedVaultMemberCountLabel(vault.memberCount)} · {sharedVaultRoleLabel(vault.role)}
        </Text>
        {badges.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 pt-0.5">
            {badges.map((badge) => (
              <SharedVaultStatusBadge key={badge.key} label={badge.label} tone="muted" />
            ))}
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={theme.icons.md} color={theme.colors.text.muted} />
    </Pressable>
  );
}

function PrimarySharedVaultOptionRow({
  disabled,
  isSelected,
  onPress,
  option
}: {
  disabled: boolean;
  isSelected: boolean;
  onPress: () => void;
  option: PrimarySharedVaultOption;
}) {
  return (
    <Pressable
      accessibilityLabel={isSelected ? `${option.title}, selected` : option.title}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: isSelected }}
      className={`min-h-14 flex-row items-center gap-3 rounded-lg border px-4 py-3 ${
        isSelected ? "border-brand bg-brand-deep" : "border-surface-border bg-background-muted"
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons
          name={isPrimarySharedVaultNone(option.id) ? "close-circle-outline" : "account-group"}
          size={theme.icons.sm}
          color={theme.colors.brand.soft}
        />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {option.title}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>
          {option.description}
        </Text>
      </View>
      {isSelected ? <MaterialCommunityIcons name="check-circle" size={theme.icons.sm} color={theme.colors.brand.soft} /> : null}
    </Pressable>
  );
}

function PrimarySharedVaultSection({
  token,
  vaultId,
  vaults
}: {
  token: string | null;
  vaultId: string | null;
  vaults: SharedVaultSummaryApi[];
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const primaryQuery = usePrimarySharedVaultQuery(token, vaultId);
  const setPrimaryMutation = useSetPrimarySharedVaultMutation(token, vaultId);
  const clearPrimaryMutation = useClearPrimarySharedVaultMutation(token, vaultId);
  const selectedVaultId = primaryQuery.data?.sharedVault?.id ?? null;
  const options = useMemo(() => primarySharedVaultOptions(vaults), [vaults]);
  const selectedOption = selectedPrimarySharedVaultOption(options, selectedVaultId);
  const isSaving = setPrimaryMutation.isPending || clearPrimaryMutation.isPending;

  const handleSelect = (optionId: PrimarySharedVaultOptionId) => {
    if (isSaving) {
      return;
    }

    setPickerVisible(false);

    if (isPrimarySharedVaultNone(optionId)) {
      if (selectedVaultId == null) {
        return;
      }
      clearPrimaryMutation.mutate(undefined, {
        onError: () => showToast("Primary shared vault could not be cleared. Try again."),
        onSuccess: () => showToast("Primary shared vault cleared.")
      });
      return;
    }

    if (String(selectedVaultId) === String(optionId)) {
      return;
    }

    setPrimaryMutation.mutate(optionId, {
      onError: () => showToast("Primary shared vault could not be updated. Try again."),
      onSuccess: () => showToast("Primary shared vault updated.")
    });
  };

  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text className="font-sans text-sm font-semibold text-text">Primary Shared Vault</Text>
        <Text className="font-sans text-sm text-text-muted">
          Choose which Shared Vault appears on your Personal Dashboard for outstanding settlements.
        </Text>
      </View>
      {primaryQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {primaryQuery.isError ? (
        <ErrorView
          message={
            primaryQuery.error instanceof ApiClientError
              ? `${primaryQuery.error.message} (${primaryQuery.error.code ?? primaryQuery.error.status ?? "ERROR"})`
              : primaryQuery.error instanceof Error
                ? primaryQuery.error.message
                : "Primary shared vault could not be loaded."
          }
          onRetry={() => primaryQuery.refetch()}
        />
      ) : null}
      {!primaryQuery.isLoading && !primaryQuery.isError ? (
        <Pressable
          accessibilityLabel="Primary Shared Vault"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving }}
          className="min-h-12 flex-row items-center gap-3 rounded-md border border-surface-border bg-surface px-3 py-2.5"
          disabled={isSaving}
          onPress={() => setPickerVisible(true)}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
            <MaterialCommunityIcons name="account-group" size={theme.icons.sm} color={theme.colors.brand.soft} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
              {isSaving ? "Saving..." : selectedOption.title}
            </Text>
            <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
              {selectedOption.description}
            </Text>
          </View>
          {isSaving ? null : <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />}
        </Pressable>
      ) : null}
      <BottomSheet onClose={() => setPickerVisible(false)} title="Primary Shared Vault" visible={pickerVisible}>
        <View className="gap-2">
          {options.map((option) => (
            <PrimarySharedVaultOptionRow
              disabled={isSaving}
              isSelected={String(option.id) === String(selectedOption.id)}
              key={`primary-${option.id}`}
              onPress={() => handleSelect(option.id)}
              option={option}
            />
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

export function SharedVaultScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const activeVault = useAuthStore((state) => state.vault);
  const authenticatedVault = useAuthStore((state) => state.authenticatedVault);

  const sharedVaultsQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => apiClient.getSharedVaults(token ?? ""),
    queryKey: queryKeys.vaults.shared
  });
  const personalVaultId = authenticatedVault?.id ?? activeVault?.id ?? null;
  const primaryQuery = usePrimarySharedVaultQuery(token, personalVaultId);
  const primaryVaultId = primaryQuery.data?.sharedVault?.id ?? null;

  const vaults = useMemo(() => sharedVaultsForSwitch(sharedVaultsQuery.data ?? []), [sharedVaultsQuery.data]);

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
              isPrimary={primaryVaultId != null && Number(primaryVaultId) === Number(vault.id)}
              key={vault.id}
              onPress={() => router.push(`/settings/shared-vault/manage/${vault.id}` as never)}
              vault={vault}
            />
          ))}
        </View>
      ) : null}

      <PrimarySharedVaultSection token={token} vaultId={personalVaultId} vaults={vaults} />

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
    </Screen>
  );
}
