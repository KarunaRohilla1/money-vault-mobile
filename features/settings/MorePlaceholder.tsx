import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { ErrorView, LoadingSkeleton, SecondaryButton } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { useSettingsQuery } from "@/features/settings/api";
import { moreActionsForVault, type MoreActionId } from "@/lib/vaultNavigation";
import { ApiClientError } from "@/services/api/client";
import { activatePersonalVaultSession, activateSharedVaultSession, clearBackendSession } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";
import type { VaultSummaryApi } from "@/services/api/types";

function isSharedVault(vault: VaultSummaryApi) {
  return vault.vaultType === "Shared";
}

function personalVaultFor(currentVault: VaultSummaryApi, accessibleVaults: VaultSummaryApi[]) {
  if (!isSharedVault(currentVault)) {
    return currentVault;
  }

  return accessibleVaults.find((vault) => !isSharedVault(vault)) ?? null;
}

export function MorePlaceholder() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const activeVault = useAuthStore((state) => state.vault);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const settingsQuery = useSettingsQuery(token, vaultId);
  const [selectedSharedVaultId, setSelectedSharedVaultId] = useState<number | null>(null);
  const [sharedPin, setSharedPin] = useState("");
  const [switchError, setSwitchError] = useState<string | null>(null);
  const logout = async () => {
    await clearBackendSession();
    setSignedOut();
    router.replace("/sign-in");
  };
  const sharedSwitchMutation = useMutation({
    mutationFn: async (vault: VaultSummaryApi) => {
      if (!token) {
        throw new Error("Missing session token.");
      }

      return activateSharedVaultSession(token, {
        pin: sharedPin,
        sharedVaultId: vault.id
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiClientError && error.status === 401) {
        setSwitchError("Incorrect Shared vault PIN.");
        return;
      }

      if (error instanceof ApiClientError && error.status === 403) {
        setSwitchError("This Shared vault is not connected to your Personal vault.");
        return;
      }

      setSwitchError("Vault could not be switched. Try again.");
    },
    onMutate: () => {
      setSwitchError(null);
    },
    onSuccess: (response) => {
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault);
      setSelectedSharedVaultId(null);
      setSharedPin("");
      settingsQuery.refetch();
      router.replace("/");
    }
  });
  const personalSwitchMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing session token.");
      }

      return activatePersonalVaultSession(token);
    },
    onError: () => {
      setSwitchError("Personal vault could not be restored. Try again.");
    },
    onMutate: () => {
      setSwitchError(null);
    },
    onSuccess: (response) => {
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault);
      setSelectedSharedVaultId(null);
      setSharedPin("");
      settingsQuery.refetch();
      router.replace("/");
    }
  });
  const personalVault = settingsQuery.data ? personalVaultFor(settingsQuery.data.currentVault, settingsQuery.data.accessibleVaults) : null;
  const sharedVaults = settingsQuery.data ? settingsQuery.data.accessibleVaults.filter(isSharedVault) : [];
  const moreActions = moreActionsForVault(activeVault);

  return (
    <Screen>
      <ScreenHeader title="More" description="Tools and configuration for your current vault." />
      {settingsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {settingsQuery.isError ? <ErrorView message="Settings could not be loaded." onRetry={() => settingsQuery.refetch()} /> : null}
      <Section title="Money tools">
        <View className="gap-3">
          {moreActions.map((action) => (
            <MoreAction key={action} {...moreActionProps(action, router)} />
          ))}
        </View>
      </Section>
      {settingsQuery.data ? (
        <Section title="Vault">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
            <View>
              <Text className="font-sans text-base font-semibold text-text">{settingsQuery.data.currentVault.name}</Text>
              <Text className="font-sans text-sm text-text-muted">
                {settingsQuery.data.currentVault.vaultType}
                {settingsQuery.data.currentVault.isAdmin ? " · Admin" : ""}
              </Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="font-sans text-sm text-text-muted">Cycle start day</Text>
              <Text className="font-sans text-sm font-semibold text-text">{settingsQuery.data.cycleStartDay}</Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="font-sans text-sm text-text-muted">Savings goal</Text>
              <CurrencyText
                value={settingsQuery.data.monthlySavingsGoal}
                currencyCode={currencyCode}
                locale={locale}
                className="text-sm font-semibold"
              />
            </View>
          </View>
        </Section>
      ) : null}
      {settingsQuery.data ? (
        <Section title="Personal Vault">
          <View className="gap-3">
            {personalVault ? (
              <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View>
                  <Text className="font-sans text-base font-semibold text-text">{personalVault.name}</Text>
                  <Text className="font-sans text-sm text-text-muted">
                    Personal Vault
                    {String(personalVault.id) === vaultId ? " - Current" : ""}
                  </Text>
                </View>
                {String(personalVault.id) !== vaultId ? (
                  <SecondaryButton disabled={personalSwitchMutation.isPending} onPress={() => personalSwitchMutation.mutate()}>
                    Return to Personal Vault
                  </SecondaryButton>
                ) : null}
              </View>
            ) : (
              <Text className="font-sans text-sm text-text-muted">Your Personal Vault will be created during onboarding.</Text>
            )}
            <Text className="font-sans text-sm text-text-muted">Money Vault supports exactly one Personal Vault for you.</Text>
          </View>
        </Section>
      ) : null}
      {settingsQuery.data ? (
        <Section title="Shared Vaults">
          <View className="gap-3">
            {sharedVaults.length === 0 ? (
              <Text className="font-sans text-sm text-text-muted">No Shared Vaults are connected yet. Only Shared Vaults can be added later.</Text>
            ) : null}
            {sharedVaults.map((vault) => (
              <View key={vault.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View>
                  <Text className="font-sans text-base font-semibold text-text">{vault.name}</Text>
                  <Text className="font-sans text-sm text-text-muted">
                    Shared Vault
                    {String(vault.id) === vaultId ? " - Current" : ""}
                  </Text>
                </View>
                {String(vault.id) !== vaultId ? (
                  selectedSharedVaultId === vault.id ? (
                    <View className="gap-3">
                      <TextInput
                        className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                        keyboardType="number-pad"
                        onChangeText={setSharedPin}
                        placeholder="Shared vault PIN"
                        placeholderTextColor={theme.colors.text.subtle}
                        secureTextEntry
                        value={sharedPin}
                      />
                      <View className="flex-row gap-2">
                        <SecondaryButton disabled={sharedSwitchMutation.isPending || sharedPin.length === 0} onPress={() => sharedSwitchMutation.mutate(vault)}>
                          Unlock Shared
                        </SecondaryButton>
                        <SecondaryButton
                          onPress={() => {
                            setSelectedSharedVaultId(null);
                            setSharedPin("");
                          }}
                        >
                          Cancel
                        </SecondaryButton>
                      </View>
                    </View>
                  ) : (
                    <SecondaryButton
                      onPress={() => {
                        setSelectedSharedVaultId(vault.id);
                        setSharedPin("");
                        setSwitchError(null);
                      }}
                    >
                      Unlock this shared vault
                    </SecondaryButton>
                  )
                ) : null}
              </View>
            ))}
            {switchError ? <Text className="font-sans text-sm text-state-danger">{switchError}</Text> : null}
            <Text className="font-sans text-sm text-text-muted">Switching vaults requires entering the target vault PIN.</Text>
          </View>
        </Section>
      ) : null}
      <Section title="Session">
        <SecondaryButton onPress={logout}>Logout</SecondaryButton>
      </Section>
    </Screen>
  );
}

interface MoreActionProps {
  onPress: () => void;
  subtitle: string;
  title: string;
}

function moreActionProps(action: MoreActionId, router: ReturnType<typeof useRouter>): MoreActionProps {
  switch (action) {
    case "transactions":
      return { title: "Transactions", subtitle: "Search and review vault activity.", onPress: () => router.push("/transactions" as never) };
    case "transfers":
      return { title: "Transfers", subtitle: "Review account-to-account movements.", onPress: () => router.push("/transfers" as never) };
    case "categories":
      return { title: "Categories", subtitle: "Review system and custom categories.", onPress: () => router.push("/categories" as never) };
    case "shared":
      return { title: "Shared", subtitle: "Review shared expenses and bills.", onPress: () => router.push("/shared" as never) };
    case "shared-expenses":
      return { title: "Shared Expenses", subtitle: "Review shared spending and settlements.", onPress: () => router.push("/shared" as never) };
    case "bills":
      return { title: "Bills", subtitle: "Review shared bill cycle activity.", onPress: () => router.push("/shared" as never) };
    case "reports":
      return { title: "Reports", subtitle: "Review cycle summaries and category trends.", onPress: () => router.push("/reports" as never) };
    case "wishlist":
      return { title: "Wishlist", subtitle: "Track savings toward planned purchases.", onPress: () => router.push("/wishlist" as never) };
    case "settings":
      return { title: "Settings", subtitle: "Review vault settings.", onPress: () => undefined };
  }
}

function MoreAction({ onPress, subtitle, title }: MoreActionProps) {
  return (
    <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
      <View>
        <Text className="font-sans text-base font-semibold text-text">{title}</Text>
        <Text className="font-sans text-sm text-text-muted">{subtitle}</Text>
      </View>
      <SecondaryButton onPress={onPress}>Open</SecondaryButton>
    </View>
  );
}
