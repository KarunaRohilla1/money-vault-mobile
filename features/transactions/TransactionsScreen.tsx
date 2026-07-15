import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useTransactionsQuery } from "@/features/transactions/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

export function TransactionsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const transactionsQuery = useTransactionsQuery(token, vaultId);

  return (
    <Screen>
      <ScreenHeader title="Transactions" description="Search and filters will use the same backend list contract." />
      {transactionsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {transactionsQuery.isError ? <ErrorView message="Transactions could not be loaded." onRetry={() => transactionsQuery.refetch()} /> : null}
      {transactionsQuery.data?.length === 0 ? (
        <EmptyState icon="swap-horizontal" title="No transactions" message="Transactions created for this vault will appear here." />
      ) : null}
      {transactionsQuery.data && transactionsQuery.data.length > 0 ? (
        <Section title="Recent transactions">
          <View className="overflow-hidden rounded-lg border border-surface-border bg-surface">
            {transactionsQuery.data.map((transaction) => {
              const isIncome = transaction.transactionType === "Income";
              return (
                <View key={transaction.id} className="flex-row items-center gap-3 border-b border-surface-border p-4">
                  <View className="h-10 w-10 items-center justify-center rounded-lg bg-background-muted">
                    <MaterialCommunityIcons
                      name={isIncome ? "arrow-down-left" : "arrow-up-right"}
                      size={20}
                      color={isIncome ? theme.colors.state.success : theme.colors.state.danger}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-sm font-semibold text-text">{transaction.categoryName}</Text>
                    <Text className="font-sans text-xs text-text-muted">
                      {transaction.accountName ?? "Account"} · {transaction.date}
                    </Text>
                  </View>
                  <CurrencyText
                    value={transaction.amount}
                    currencyCode={currencyCode}
                    locale={locale}
                    className={isIncome ? "text-sm font-semibold text-state-success" : "text-sm font-semibold text-state-danger"}
                  />
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}
