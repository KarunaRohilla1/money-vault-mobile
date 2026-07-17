import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useDeleteTransactionMutation, useTransactionsQuery } from "@/features/transactions/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

export function TransactionsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const transactionsQuery = useTransactionsQuery(token, vaultId);
  const deleteTransaction = useDeleteTransactionMutation(token, vaultId);

  return (
    <Screen>
      <ScreenHeader title="Transactions" description="Search and filters use the backend transaction list contract." />
      <PrimaryButton onPress={() => router.push("/transaction/new" as never)}>Add transaction</PrimaryButton>
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
                <View key={transaction.id} className="gap-3 border-b border-surface-border p-4">
                  <View className="flex-row items-center gap-3">
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
                        {transaction.accountName ?? "Account"} - {transaction.date}
                      </Text>
                    </View>
                    <CurrencyText
                      value={transaction.amount}
                      currencyCode={currencyCode}
                      locale={locale}
                      className={isIncome ? "text-sm font-semibold text-state-success" : "text-sm font-semibold text-state-danger"}
                    />
                  </View>
                  {transaction.notes ? <Text className="font-sans text-xs text-text-muted">{transaction.notes}</Text> : null}
                  <View className="flex-row gap-2">
                    <SecondaryButton onPress={() => router.push(`/transaction/${transaction.id}` as never)}>Edit</SecondaryButton>
                    <SecondaryButton disabled={deleteTransaction.isPending} onPress={() => deleteTransaction.mutate(transaction.id)}>
                      Delete
                    </SecondaryButton>
                  </View>
                </View>
              );
            })}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}
