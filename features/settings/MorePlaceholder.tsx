import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState, type RefObject } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useSettingsQuery } from "@/features/settings/api";
import { resetNavigationAfterLogout } from "@/features/settings/logoutNavigation";
import {
  filterMoreMenuSections,
  isSharedVault,
  moreMenuSectionsForVault,
  roleLabel,
  switchTarget,
  type MoreRowModel
} from "@/features/settings/moreModel";
import { ApiClientError } from "@/services/api/client";
import { logoutBackendSession } from "@/services/api/logout";
import { activatePersonalVaultSession, activateSharedVaultSession } from "@/services/api/session";
import type { VaultSummaryApi } from "@/services/api/types";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

const LOGOUT_FAILURE_MESSAGE = "Logout could not be completed. Try again.";

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
    case "danger":
      return theme.colors.state.danger;
    case "brand":
    default:
      return theme.colors.brand.soft;
  }
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="font-sans text-sm font-bold uppercase text-text-muted">{children}</Text>;
}

function SettingsRow({ onLogoutPress, row }: { onLogoutPress: () => void; row: MoreRowModel }) {
  const router = useRouter();
  const color = iconToneColor(row.iconTone);
  const destructive = row.iconTone === "danger";

  const handlePress = () => {
    if (row.action === "logout") {
      onLogoutPress();
      return;
    }

    if (row.action === "in-progress") {
      showToast("This feature is still in progress.");
      return;
    }

    if (row.route) {
      router.push(row.route as never);
    }
  };

  return (
    <Pressable
      accessibilityLabel={row.title}
      accessibilityRole="button"
      className="min-h-16 flex-row items-center gap-4 border-b border-surface-border py-3 last:border-b-0"
      onPress={handlePress}
    >
      <View className={destructive ? "h-10 w-10 items-center justify-center rounded-lg bg-surface-pressed" : "h-10 w-10 items-center justify-center rounded-lg bg-brand-deep"}>
        <MaterialCommunityIcons name={row.icon} size={theme.icons.md} color={color} />
      </View>
      <Text className={destructive ? "min-w-0 flex-1 font-sans text-base font-semibold text-state-danger" : "min-w-0 flex-1 font-sans text-base font-semibold text-text"} numberOfLines={1}>
        {row.title}
      </Text>
      {row.action === "logout" ? null : <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.subtle} />}
    </Pressable>
  );
}

function SettingsSection({ onLogoutPress, rows, title }: { onLogoutPress: () => void; rows: MoreRowModel[]; title: string }) {
  return (
    <View className="gap-3">
      <SectionTitle>{title}</SectionTitle>
      <View className="rounded-xl border border-surface-border bg-surface px-4">
        {rows.map((row) => (
          <SettingsRow key={row.id} onLogoutPress={onLogoutPress} row={row} />
        ))}
      </View>
    </View>
  );
}

function LogoutConfirmationSheet({
  errorMessage,
  onCancel,
  onConfirm,
  pending,
  visible
}: {
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  visible: boolean;
}) {
  return (
    <BottomSheet title="Log Out?" visible={visible} onClose={pending ? () => undefined : onCancel}>
      <View className="gap-5">
        <Text className="font-sans text-base leading-6 text-text-muted">Are you sure you want to log out of Money Vault?</Text>
        {errorMessage ? (
          <View className="rounded-lg border border-state-danger/40 bg-surface-pressed p-3">
            <Text className="font-sans text-sm font-semibold text-state-danger">{errorMessage}</Text>
          </View>
        ) : null}
        <View className="gap-3">
          <SecondaryButton accessibilityLabel="Cancel logout" disabled={pending} onPress={onCancel}>
            Cancel
          </SecondaryButton>
          <PrimaryButton accessibilityLabel="Confirm logout" className="bg-state-danger" disabled={pending} icon="logout" loading={pending} onPress={onConfirm}>
            Log Out
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}

function MoreSearchBar({
  inputRef,
  onChange,
  onClose,
  value
}: {
  inputRef: RefObject<TextInput | null>;
  onChange: (value: string) => void;
  onClose: () => void;
  value: string;
}) {
  return (
    <View className="h-12 flex-row rounded-xl border border-surface-border bg-surface">
      <View className="min-w-0 flex-1 flex-row items-center gap-3 px-4">
        <MaterialCommunityIcons name="magnify" size={theme.icons.md} color={theme.colors.text.muted} />
        <TextInput
          ref={inputRef}
          accessibilityLabel="Search tools and preferences"
          className="h-12 min-w-0 flex-1 font-sans text-base text-text"
          onChangeText={onChange}
          placeholder="Search tools and preferences..."
          placeholderTextColor={theme.colors.text.muted}
          value={value}
        />
      </View>
      <Pressable accessibilityLabel="Close search" accessibilityRole="button" className="h-12 w-12 items-center justify-center" onPress={onClose}>
        <MaterialCommunityIcons name="close" size={theme.icons.sm} color={theme.colors.text.muted} />
      </Pressable>
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
  const searchInputRef = useRef<TextInput>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const settingsQuery = useSettingsQuery(token, vaultId);
  const currentVault = settingsQuery.data?.currentVault;
  const targetVault = settingsQuery.data && currentVault ? switchTarget(currentVault, settingsQuery.data.accessibleVaults) : null;
  const menuSections = useMemo(() => moreMenuSectionsForVault(currentVault), [currentVault]);
  const visibleSections = useMemo(() => filterMoreMenuSections(menuSections, searchQuery), [menuSections, searchQuery]);
  const showVaultCard = !searchActive && !searchQuery.trim();
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
  const logoutMutation = useMutation({
    mutationFn: logoutBackendSession,
    onError: () => {
      setLogoutError(LOGOUT_FAILURE_MESSAGE);
    },
    onSuccess: () => {
      setLogoutError(null);
      setLogoutVisible(false);
      resetNavigationAfterLogout(router);
    }
  });
  const switchError =
    switchMutation.error instanceof ApiClientError
      ? "Vault could not be switched. Try again."
      : switchMutation.error
        ? "No vault is available to switch."
        : null;

  const openLogoutConfirmation = () => {
    setLogoutError(null);
    setLogoutVisible(true);
  };

  const closeLogoutConfirmation = () => {
    if (!logoutMutation.isPending) {
      setLogoutVisible(false);
      setLogoutError(null);
    }
  };

  const openSearch = () => {
    setSearchActive(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearchActive(false);
    setSearchQuery("");
  };

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-4xl font-bold text-text">More</Text>
          <Text className="mt-2 font-sans text-base text-text-muted">Tools and preferences for your vault.</Text>
        </View>
        <Pressable
          accessibilityLabel={searchActive ? "Close search" : "Search"}
          accessibilityRole="button"
          className="h-14 w-14 items-center justify-center rounded-full border border-surface-border bg-surface"
          onPress={searchActive ? closeSearch : openSearch}
        >
          <MaterialCommunityIcons name={searchActive ? "close" : "magnify"} size={theme.icons.lg} color={theme.colors.text.DEFAULT} />
        </Pressable>
      </View>

      {searchActive ? <MoreSearchBar inputRef={searchInputRef} onChange={setSearchQuery} onClose={closeSearch} value={searchQuery} /> : null}

      {settingsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {settingsQuery.isError ? <ErrorView message="Settings could not be loaded." onRetry={() => settingsQuery.refetch()} /> : null}

      {showVaultCard && currentVault ? (
        <VaultCard
          currentVault={currentVault}
          disabled={!targetVault}
          onSwitch={() => switchMutation.mutate()}
          switching={switchMutation.isPending}
        />
      ) : null}
      {switchError ? <Text className="font-sans text-sm text-state-danger">{switchError}</Text> : null}

      {searchQuery.trim() && visibleSections.length === 0 ? (
        <View className="items-center gap-3 rounded-xl border border-surface-border bg-surface p-5">
          <MaterialCommunityIcons name="magnify" size={theme.icons.lg} color={theme.colors.brand.soft} />
          <Text className="font-sans text-lg font-bold text-text">No matching tools</Text>
          <Text className="text-center font-sans text-sm text-text-muted">Try a different search term.</Text>
        </View>
      ) : (
        visibleSections.map((section) => (
          <SettingsSection key={section.id} onLogoutPress={openLogoutConfirmation} rows={section.rows} title={section.title} />
        ))
      )}
      <LogoutConfirmationSheet
        errorMessage={logoutError}
        onCancel={closeLogoutConfirmation}
        onConfirm={() => logoutMutation.mutate()}
        pending={logoutMutation.isPending}
        visible={logoutVisible}
      />
    </Screen>
  );
}