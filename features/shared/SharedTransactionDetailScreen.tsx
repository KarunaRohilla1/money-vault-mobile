import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useSharedExpensesQuery } from "@/features/shared/api";
import { sharedRoutes } from "@/features/shared/routes";
import { resolveSharedActivityIcon } from "@/features/shared/sharedDashboardModel";
import { canManageSharedExpense, findSharedExpenseById } from "@/features/shared/sharedTransactionsModel";
import { useDeleteTransactionMutation } from "@/features/transactions/api";
import { formatIsoDateOnly } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { goBackOrReplace } from "@/lib/navigation";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-surface-border py-3 last:border-b-0">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      <Text className="min-w-0 flex-1 text-right font-sans text-sm font-semibold text-text" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function SharedTransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = params.id ? Number(params.id) : null;
  const [deleteVisible, setDeleteVisible] = useState(false);
  const token = useAuthStore((state) => state.token);
  const vault = useAuthStore((state) => state.vault);
  const vaultId = vault?.id ?? null;
  const authenticatedVaultId = useAuthStore((state) => state.authenticatedVault?.id ?? null);
  const sharedVaultId = vault?.vaultType === "Shared" && vaultId ? Number(vaultId) : null;
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const deleteTransaction = useDeleteTransactionMutation(token, vaultId, sharedVaultId);
  const expensesQuery = useSharedExpensesQuery(token, vaultId, sharedVaultId);
  const expense =
    transactionId !== null && Number.isFinite(transactionId)
      ? findSharedExpenseById(expensesQuery.data?.data?.expenses ?? [], transactionId)
      : null;

  if (transactionId === null || !Number.isFinite(transactionId)) {
    return (
      <Screen>
        <ErrorView message="Transaction could not be opened." onRetry={() => goBackOrReplace(router, sharedRoutes.transactions)} />
      </Screen>
    );
  }

  if (expensesQuery.isLoading) {
    return (
      <Screen>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (expensesQuery.isError) {
    return (
      <Screen>
        <ErrorView message="Shared transaction could not be loaded." onRetry={() => expensesQuery.refetch()} />
      </Screen>
    );
  }

  if (!expense) {
    return (
      <Screen>
        <EmptyState icon="receipt-text-outline" title="Transaction not found" message="This shared expense is no longer available in the current cycle." />
      </Screen>
    );
  }

  const title = expense.merchant || expense.category;
  const dateLabel = formatIsoDateOnly(expense.date, locale, { day: "numeric", month: "long", year: "numeric" });
  const icon = resolveSharedActivityIcon(expense.category_icon, expense.category);
  const canManage = canManageSharedExpense(expense, authenticatedVaultId ? Number(authenticatedVaultId) : null);
  const expenseId = expense.id;
  const expenseAmount = expense.amount;

  async function handleDelete() {
    try {
      await deleteTransaction.mutateAsync(expenseId);
      setDeleteVisible(false);
      showToast("Transaction deleted.");
      router.replace(sharedRoutes.transactions as never);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete transaction.");
    }
  }

  return (
    <Screen contentClassName="gap-4 px-5 pt-4">
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityLabel="Back" accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={theme.icons.lg} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <Text className="font-sans text-lg font-bold text-text">Shared Expense</Text>
        <View className="h-11 w-11" />
      </View>

      <View className="items-center rounded-lg border border-surface-border bg-surface p-5">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons name={icon} size={theme.icons.lg} color={theme.colors.brand.soft} />
        </View>
        <Text className="text-center font-sans text-xl font-bold text-text" numberOfLines={2}>
          {title}
        </Text>
        <CurrencyText value={expense.amount} currencyCode={currencyCode} locale={locale} className="text-3xl font-bold text-accent-rose" />
        <Text className="mt-1 font-sans text-sm text-text-muted">{expense.split_label}</Text>
      </View>

      <View className="rounded-lg border border-surface-border bg-surface px-4">
        <DetailRow label="Paid by" value={expense.paid_by} />
        <DetailRow label="Category" value={expense.category} />
        <DetailRow label="Split" value={expense.split_label} />
        <DetailRow label="Allocation" value={expense.allocation_method} />
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Your share" value={formatCurrency(expense.my_share, currencyCode, locale)} />
        <DetailRow label="Other share" value={formatCurrency(expense.other_share, currencyCode, locale)} />
        <DetailRow label="Settlement" value={expense.settlement_label} />
        <DetailRow label="Notes" value={expense.notes || null} />
      </View>

      {canManage ? (
        <View className="gap-3">
          <PrimaryButton onPress={() => router.push(sharedRoutes.transactionEdit(expense.id) as never)}>Edit</PrimaryButton>
          <SecondaryButton accessibilityLabel="Delete transaction" icon="trash-can-outline" onPress={() => setDeleteVisible(true)}>
            Delete
          </SecondaryButton>
        </View>
      ) : null}

      <BottomSheet visible={deleteVisible} title="Delete Transaction" onClose={() => setDeleteVisible(false)}>
        <View className="gap-4">
          <Text className="font-sans text-sm text-text-muted">
            Delete {title} for <CurrencyText value={expenseAmount} currencyCode={currencyCode} locale={locale} className="text-sm text-text" /> on {dateLabel}? This cannot be undone.
          </Text>
          <PrimaryButton
            accessibilityLabel="Confirm delete transaction"
            className="bg-state-danger"
            loading={deleteTransaction.isPending}
            disabled={deleteTransaction.isPending}
            icon="trash-can-outline"
            onPress={() => void handleDelete()}
          >
            Delete Transaction
          </PrimaryButton>
          <SecondaryButton disabled={deleteTransaction.isPending} onPress={() => setDeleteVisible(false)}>
            Cancel
          </SecondaryButton>
        </View>
      </BottomSheet>
    </Screen>
  );
}
