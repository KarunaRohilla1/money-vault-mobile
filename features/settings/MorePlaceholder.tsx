import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { ErrorView, LoadingSkeleton, SecondaryButton } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { useSettingsQuery } from "@/features/settings/api";
import { queryClient } from "@/lib/queryClient";
import { clearBackendSession } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function MorePlaceholder() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const settingsQuery = useSettingsQuery(token, vaultId);
  const logout = async () => {
    await clearBackendSession();
    queryClient.clear();
    setSignedOut();
    router.replace("/sign-in");
  };

  return (
    <Screen>
      <ScreenHeader title="More" description="Tools and configuration for your current vault." />
      {settingsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {settingsQuery.isError ? <ErrorView message="Settings could not be loaded." onRetry={() => settingsQuery.refetch()} /> : null}
      <Section title="Money tools">
        <View className="gap-3">
          <MoreAction title="Transactions" subtitle="Search and review vault activity." onPress={() => router.push("/transactions" as never)} />
          <MoreAction title="Transfers" subtitle="Review account-to-account movements." onPress={() => router.push("/transfers" as never)} />
          <MoreAction title="Categories" subtitle="Review system and custom categories." onPress={() => router.push("/categories" as never)} />
          <MoreAction title="Reports" subtitle="Review cycle summaries and category trends." onPress={() => router.push("/reports" as never)} />
          <MoreAction title="Wishlist" subtitle="Track savings toward planned purchases." onPress={() => router.push("/wishlist" as never)} />
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
        <Section title="Vault switching">
          <View className="gap-3">
            {settingsQuery.data.accessibleVaults.map((vault) => (
              <View key={vault.id} className="rounded-lg border border-surface-border bg-surface p-4">
                <Text className="font-sans text-base font-semibold text-text">{vault.name}</Text>
                <Text className="font-sans text-sm text-text-muted">{vault.vaultType}</Text>
              </View>
            ))}
            <Text className="font-sans text-sm text-text-muted">To switch vaults, log out and unlock the target vault with its PIN.</Text>
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
