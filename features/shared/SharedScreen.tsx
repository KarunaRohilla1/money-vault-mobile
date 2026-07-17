import { Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, SecondaryButton, Tag } from "@/components/ui";
import {
  useMarkSharedBillPaidMutation,
  useSharedBillsQuery,
  useSharedExpensesQuery,
  useSkipSharedBillMutation
} from "@/features/shared/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentVaultNumber(vaultId: string | null) {
  if (!vaultId) {
    return null;
  }

  const parsed = Number(vaultId);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SharedScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const expensesQuery = useSharedExpensesQuery(token, vaultId);
  const billsQuery = useSharedBillsQuery(token, vaultId);
  const markPaid = useMarkSharedBillPaidMutation(token, vaultId);
  const skipBill = useSkipSharedBillMutation(token, vaultId);
  const currentVaultId = currentVaultNumber(vaultId);

  const data = expensesQuery.data?.data;
  const bills = billsQuery.data?.data;

  return (
    <Screen>
      <ScreenHeader title="Shared" description="Shared expenses and bills from the connected Money Vault." />
      {expensesQuery.isLoading || billsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {expensesQuery.isError ? <ErrorView message="Shared expenses could not be loaded." onRetry={() => expensesQuery.refetch()} /> : null}
      {billsQuery.isError ? <ErrorView message="Shared bills could not be loaded." onRetry={() => billsQuery.refetch()} /> : null}

      {data ? (
        <Section title="Shared spending">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans text-sm text-text-muted">This cycle</Text>
              <CurrencyText
                value={data.summary.total_shared_spend}
                currencyCode={currencyCode}
                locale={locale}
                className="text-xl font-bold"
              />
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Tag label={`${data.summary.total_transactions} transactions`} tone="neutral" />
              <Tag label={`Paid by you ${formatShortMoney(data.summary.paid_by_current, currencyCode, locale)}`} tone="success" />
              <Tag label={`Paid by others ${formatShortMoney(data.summary.paid_by_other, currencyCode, locale)}`} tone="warning" />
            </View>
          </View>
        </Section>
      ) : null}

      {bills ? (
        <Section title="Shared bills">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-sans text-sm text-text-muted">{bills.cycle.display_name}</Text>
                <Text className="font-sans text-lg font-semibold text-text">{bills.summary.pending_count} pending</Text>
              </View>
              <CurrencyText value={bills.summary.remaining_amount} currencyCode={currencyCode} locale={locale} className="text-lg font-semibold" />
            </View>
            {bills.summary.balance.length > 0 ? (
              <View className="gap-2">
                {bills.summary.balance.slice(0, 3).map((balance, index) => (
                  <Text key={`${balance.from}-${balance.to}-${index}`} className="font-sans text-xs text-text-muted">
                    {balance.from} pays {balance.to} {formatShortMoney(balance.amount, currencyCode, locale)}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="font-sans text-xs text-text-muted">Shared bill cycle is balanced.</Text>
            )}
          </View>
        </Section>
      ) : null}

      {bills ? (
        <Section title="Pending bills">
          {bills.pending_bills.length === 0 ? (
            <EmptyState icon="calendar-check-outline" title="No pending shared bills" message="Pending shared bills will appear here." />
          ) : (
            <View className="gap-3">
              {bills.pending_bills.slice(0, 8).map((bill) => (
                <View key={bill.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                  <View className="flex-row justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-sans text-base font-semibold text-text">{bill.name}</Text>
                      <Text className="font-sans text-xs text-text-muted">
                        Due {bill.due_date} - {bill.category_name || "Uncategorized"}
                      </Text>
                    </View>
                    <CurrencyText value={bill.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                  </View>
                  <View className="flex-row gap-2">
                    <SecondaryButton
                      disabled={!currentVaultId || markPaid.isPending}
                      onPress={() => {
                        if (currentVaultId) {
                          markPaid.mutate({
                            instanceId: bill.id,
                            payerVaultId: currentVaultId,
                            paymentDate: todayIso()
                          });
                        }
                      }}
                    >
                      Mark paid
                    </SecondaryButton>
                    <SecondaryButton disabled={skipBill.isPending} onPress={() => skipBill.mutate(bill.id)}>
                      Skip
                    </SecondaryButton>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>
      ) : null}

      {data ? (
        <Section title="Recent shared expenses">
          {data.expenses.length === 0 ? (
            <EmptyState icon="account-group-outline" title="No shared expenses" message="Shared transactions for this cycle will appear here." />
          ) : (
            <View className="gap-3">
              {data.expenses.slice(0, 8).map((expense) => (
                <View key={expense.id} className="gap-2 rounded-lg border border-surface-border bg-surface p-4">
                  <View className="flex-row justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-sans text-base font-semibold text-text">{expense.merchant}</Text>
                      <Text className="font-sans text-xs text-text-muted">
                        {expense.date} - Paid by {expense.paid_by}
                      </Text>
                    </View>
                    <CurrencyText value={expense.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                  </View>
                  <Text className="font-sans text-xs text-text-muted">{expense.settlement_label} {formatShortMoney(expense.settlement_amount, currencyCode, locale)}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>
      ) : null}
    </Screen>
  );
}

function formatShortMoney(value: number, currencyCode: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}
