import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ErrorView, LoadingSkeleton } from "@/components/ui";
import { useSettingsQuery } from "@/features/settings/api";
import {
  isSharedVault,
  moneyRows,
  preferenceRows,
  roleLabel,
  switchTarget,
  type MoreRowModel
} from "@/features/settings/moreModel";
import { ApiClientError } from "@/services/api/client";
import { activatePersonalVaultSession, activateSharedVaultSession } from "@/services/api/session";
import type { VaultSummaryApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

function iconToneColor(tone: MoreRowModel["iconTone"]) {
  switch (tone) {
    case "blue":
      return theme.colors.state.info;
    case "green":
      return theme.colors.state.success;
    case "orange":
      return theme.colors.state.warning;
    case "pink":
      return theme.colors.accent.rose;
    case "muted":
      return theme.colors.text.muted;
    case "brand":
    default:
      return theme.colors.brand.soft;
  }
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="font-sans text-sm font-bold uppercase text-text-muted">{children}</Text>;
}

function SettingsRow({ row }: { row: MoreRowModel }) {
  const router = useRouter();
  const color = iconToneColor(row.iconTone);

  return (
    <Pressable
      accessibilityLabel={row.title}
      accessibilityRole="button"
      className="min-h-16 flex-row items-center gap-4 border-b border-surface-border py-3 last:border-b-0"
      onPress={() => router.push(row.route as never)}
    >
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
        <MaterialCommunityIcons name={row.icon} size={theme.icons.md} color={color} />
      </View>
      <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
        {row.title}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.subtle} />
    </Pressable>
  );
}

function SettingsSection({ rows, title }: { rows: MoreRowModel[]; title: string }) {
  return (
    <View className="gap-3">
      <SectionTitle>{title}</SectionTitle>
      <View className="rounded-xl border border-surface-border bg-surface px-4">
        {rows.map((row) => (
          <SettingsRow key={row.id} row={row} />
        ))}
      </View>
    </View>
  );
}

function VaultCard({
  currentVault,
  disabled,
  onSwitch,
  switching
}: {
  currentVault: VaultSummaryApi;
  disabled: boolean;
  onSwitch: () => void;
  switching: boolean;
}) {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-brand-muted bg-surface p-4">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={isSharedVault(currentVault) ? "account-group" : "wallet"} size={theme.icons.lg} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-xl font-bold text-text" numberOfLines={1}>
          {currentVault.name}
        </Text>
        <View className="mt-2 self-start rounded-md bg-brand-deep px-2 py-1">
          <Text className="font-sans text-xs font-bold text-brand-soft">{roleLabel(currentVault)}</Text>
        </View>
      </View>
      <View className="items-end gap-2">
        <Text className="font-sans text-xs text-text-muted">Current vault</Text>
        <Pressable
          accessibilityLabel="Switch Vault"
          accessibilityRole="button"
          className={disabled ? "min-h-12 flex-row items-center gap-2 rounded-lg border border-surface-border px-4 opacity-50" : "min-h-12 flex-row items-center gap-2 rounded-lg border border-brand-muted px-4"}
          disabled={disabled || switching}
          onPress={onSwitch}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={theme.icons.sm} color={theme.colors.brand.soft} />
          <Text className="font-sans text-sm font-bold text-brand-soft">{switching ? "Switching..." : "Switch Vault"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MorePlaceholder() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const settingsQuery = useSettingsQuery(token, vaultId);
  const currentVault = settingsQuery.data?.currentVault;
  const targetVault = settingsQuery.data && currentVault ? switchTarget(currentVault, settingsQuery.data.accessibleVaults) : null;
  const switchMutation = useMutation({
    mutationFn: async () => {
      if (!token || !currentVault || !targetVault) {
        throw new Error("No vault available to switch.");
      }

      if (isSharedVault(currentVault)) {
        return activatePersonalVaultSession(token);
      }

      return activateSharedVaultSession(token, {
        sharedVaultId: targetVault.id
      });
    },
    onSuccess: (response) => {
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault);
      router.replace("/");
    }
  });
  const switchError =
    switchMutation.error instanceof ApiClientError
      ? "Vault could not be switched. Try again."
      : switchMutation.error
        ? "No vault is available to switch."
        : null;

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-4xl font-bold text-text">More</Text>
          <Text className="mt-2 font-sans text-base text-text-muted">Tools and preferences for your vault.</Text>
        </View>
        <Pressable accessibilityLabel="Search" accessibilityRole="button" className="h-14 w-14 items-center justify-center rounded-full border border-surface-border bg-surface">
          <MaterialCommunityIcons name="magnify" size={theme.icons.lg} color={theme.colors.text.DEFAULT} />
        </Pressable>
      </View>

      {settingsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {settingsQuery.isError ? <ErrorView message="Settings could not be loaded." onRetry={() => settingsQuery.refetch()} /> : null}

      {currentVault ? (
        <VaultCard
          currentVault={currentVault}
          disabled={!targetVault}
          onSwitch={() => switchMutation.mutate()}
          switching={switchMutation.isPending}
        />
      ) : null}
      {switchError ? <Text className="font-sans text-sm text-state-danger">{switchError}</Text> : null}

      <SettingsSection rows={moneyRows} title="Money" />
      <SettingsSection rows={preferenceRows} title="Vault & Preferences" />
    </Screen>
  );
}
