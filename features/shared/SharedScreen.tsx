import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, SecondaryButton, Tag } from "@/components/ui";
import {
  useMarkSharedBillPaidMutation,
  useMarkSharedSettlementMutation,
  useSharedBillsQuery,
  useSharedExpensesQuery,
  useSharedSettlementsQuery,
  useSkipSharedBillMutation
} from "@/features/shared/api";
import type { SharedSettlementAccountApi, SharedSettlementItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

interface SettlementFormState {
  amount: string;
  fromAccountId: number | null;
  settlementDate: string;
  toAccountId: number | null;
}

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

function settlementKey(item: SharedSettlementItemApi) {
  return `${item.shared_vault_id}-${item.from_vault_id}-${item.to_vault_id}`;
}

function settlementDefaults(item: SharedSettlementItemApi): SettlementFormState {
  return {
    amount: String(item.amount),
    fromAccountId: item.from_accounts[0]?.id ?? null,
    settlementDate: todayIso(),
    toAccountId: item.to_accounts[0]?.id ?? null
  };
}

function selectedSettlementForm(item: SharedSettlementItemApi, forms: Record<string, SettlementFormState>) {
  return forms[settlementKey(item)] ?? settlementDefaults(item);
}

export function SharedScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const expensesQuery = useSharedExpensesQuery(token, vaultId);
  const billsQuery = useSharedBillsQuery(token, vaultId);
  const settlementsQuery = useSharedSettlementsQuery(token, vaultId);
  const markPaid = useMarkSharedBillPaidMutation(token, vaultId);
  const markSettlement = useMarkSharedSettlementMutation(token, vaultId);
  const skipBill = useSkipSharedBillMutation(token, vaultId);
  const currentVaultId = currentVaultNumber(vaultId);
  const [settlementForms, setSettlementForms] = useState<Record<string, SettlementFormState>>({});

  const data = expensesQuery.data?.data;
  const bills = billsQuery.data?.data;
  const settlements = settlementsQuery.data?.data;

  const updateSettlementForm = (item: SharedSettlementItemApi, partial: Partial<SettlementFormState>) => {
    const key = settlementKey(item);
    setSettlementForms((current) => ({
      ...current,
      [key]: {
        ...selectedSettlementForm(item, current),
        ...partial
      }
    }));
  };

  const markItemSettled = (item: SharedSettlementItemApi) => {
    const form = selectedSettlementForm(item, settlementForms);
    const amount = Number(form.amount);

    if (!form.fromAccountId || !form.toAccountId || !Number.isFinite(amount) || amount <= 0 || !form.settlementDate.trim()) {
      return;
    }

    markSettlement.mutate({
      amount,
      fromAccountId: form.fromAccountId,
      fromVaultId: item.from_vault_id,
      settlementDate: form.settlementDate.trim(),
      sharedVaultId: item.shared_vault_id,
      toAccountId: form.toAccountId,
      toVaultId: item.to_vault_id
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Shared" description="Shared expenses and bills from the connected Money Vault." />
      {expensesQuery.isLoading || billsQuery.isLoading || settlementsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {expensesQuery.isError ? <ErrorView message="Shared expenses could not be loaded." onRetry={() => expensesQuery.refetch()} /> : null}
      {billsQuery.isError ? <ErrorView message="Shared bills could not be loaded." onRetry={() => billsQuery.refetch()} /> : null}
      {settlementsQuery.isError ? <ErrorView message="Shared settlements could not be loaded." onRetry={() => settlementsQuery.refetch()} /> : null}

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

      {settlements ? (
        <Section title="Settlements">
          {settlements.items.length === 0 ? (
            <EmptyState icon="check-circle-outline" title="All settled" message="Outstanding shared settlements will appear here." />
          ) : (
            <View className="gap-3">
              <View className="gap-2 rounded-lg border border-surface-border bg-surface p-4">
                <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">{settlements.label}</Text>
                <CurrencyText value={settlements.amount} currencyCode={currencyCode} locale={locale} className="text-xl font-bold" />
              </View>
              {settlements.items.map((item) => {
                const form = selectedSettlementForm(item, settlementForms);
                const amount = Number(form.amount);
                const cannotSettle =
                  !form.fromAccountId ||
                  !form.toAccountId ||
                  !Number.isFinite(amount) ||
                  amount <= 0 ||
                  amount > item.amount ||
                  !form.settlementDate.trim();

                return (
                  <View key={settlementKey(item)} className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
                    <View className="flex-row justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-sans text-base font-semibold text-text">
                          {item.from_name} pays {item.to_name}
                        </Text>
                        <Text className="font-sans text-xs text-text-muted">{item.shared_vault_name}</Text>
                      </View>
                      <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                    </View>
                    <SettlementAccountPicker
                      accounts={item.from_accounts}
                      label="Paying account"
                      selectedId={form.fromAccountId}
                      onSelect={(fromAccountId) => updateSettlementForm(item, { fromAccountId })}
                    />
                    <SettlementAccountPicker
                      accounts={item.to_accounts}
                      label="Receiving account"
                      selectedId={form.toAccountId}
                      onSelect={(toAccountId) => updateSettlementForm(item, { toAccountId })}
                    />
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="mb-2 font-sans text-xs font-semibold uppercase text-text-muted">Amount</Text>
                        <TextInput
                          className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                          inputMode="decimal"
                          onChangeText={(amountText) => updateSettlementForm(item, { amount: amountText })}
                          placeholder="0"
                          placeholderTextColor={theme.colors.text.muted}
                          value={form.amount}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-2 font-sans text-xs font-semibold uppercase text-text-muted">Date</Text>
                        <TextInput
                          className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                          onChangeText={(settlementDate) => updateSettlementForm(item, { settlementDate })}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={theme.colors.text.muted}
                          value={form.settlementDate}
                        />
                      </View>
                    </View>
                    <SecondaryButton disabled={cannotSettle || markSettlement.isPending} onPress={() => markItemSettled(item)}>
                      Mark settled
                    </SecondaryButton>
                  </View>
                );
              })}
            </View>
          )}
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

function SettlementAccountPicker({
  accounts,
  label,
  onSelect,
  selectedId
}: {
  accounts: SharedSettlementAccountApi[];
  label: string;
  onSelect: (accountId: number) => void;
  selectedId: number | null;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-semibold uppercase text-text-muted">{label}</Text>
      {accounts.length === 0 ? (
        <Text className="font-sans text-xs text-state-danger">No active accounts available.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {accounts.map((account) => (
            <SecondaryButton
              key={account.id}
              className={selectedId === account.id ? "border-brand-soft" : undefined}
              onPress={() => onSelect(account.id)}
            >
              {account.name}
            </SecondaryButton>
          ))}
        </View>
      )}
    </View>
  );
}
