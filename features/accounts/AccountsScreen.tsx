import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useAccountsQuery, useSetPrimaryAccountMutation } from "@/features/accounts/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

export function AccountsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const setPrimaryMutation = useSetPrimaryAccountMutation(token, vaultId);

  return (
    <Screen>
      <ScreenHeader title="Accounts" description="Balances are derived from opening balances and posted transactions." />

      {accountsQuery.isLoading ? (
        <View className="gap-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </View>
      ) : null}

      {accountsQuery.isError ? (
        <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} />
      ) : null}

      {accountsQuery.data?.length === 0 ? (
        <EmptyState icon="wallet-outline" title="No accounts yet" message="Create accounts in the legacy app or add one once forms are enabled here." />
      ) : null}

      {accountsQuery.data && accountsQuery.data.length > 0 ? (
        <Section title="All accounts">
          <View className="gap-3">
            {accountsQuery.data.map((account) => (
              <View key={account.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-lg bg-brand-deep">
                      <MaterialCommunityIcons name={account.type === "Credit Card" ? "credit-card-outline" : "wallet-outline"} size={22} color={theme.colors.brand.soft} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-base font-semibold text-text">{account.name}</Text>
                      <Text className="font-sans text-xs text-text-muted">
                        {account.type}
                        {account.isPrimary ? " · Primary" : ""}
                      </Text>
                    </View>
                  </View>
                  <CurrencyText
                    value={account.balance ?? account.openingBalance}
                    currencyCode={currencyCode}
                    locale={locale}
                    className="text-right text-lg font-semibold"
                  />
                </View>
                {!account.isPrimary ? (
                  <SecondaryButton disabled={setPrimaryMutation.isPending} onPress={() => setPrimaryMutation.mutate(account.id)}>
                    Make primary
                  </SecondaryButton>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}
