import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useDeleteTransactionMutation, useTransactionDetailQuery } from "@/features/transactions/api";
import { formatIsoDateOnly } from "@/lib/date";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

interface TransactionDetailScreenProps {
  transactionId: number | null;
}

function detailAmountClass(transactionType: string) {
  const normalized = transactionType.trim().toLowerCase();
  if (normalized === "income") {
    return "text-3xl font-bold text-state-success";
  }

  if (normalized.includes("transfer")) {
    return "text-3xl font-bold text-state-info";
  }

  return "text-3xl font-bold text-accent-rose";
}

function DetailRow({ label, value }: { label: string; value?: string | null | undefined }) {
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

export function TransactionDetailScreen({ transactionId }: TransactionDetailScreenProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const detailQuery = useTransactionDetailQuery(token, vaultId, transactionId);
  const deleteTransaction = useDeleteTransactionMutation(token, vaultId);

  if (transactionId === null) {
    return (
      <Screen>
        <ErrorView message="Transaction could not be opened." onRetry={() => router.back()} />
      </Screen>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <Screen>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Screen>
        <ErrorView message="Transaction could not be loaded." onRetry={() => detailQuery.refetch()} />
      </Screen>
    );
  }

  const transaction = detailQuery.data;
  const title = transaction.notes || transaction.categoryName || transaction.transactionType;
  const dateLabel = formatIsoDateOnly(transaction.date, locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <Screen contentClassName="gap-4 px-5 pt-4">
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityLabel="Back" accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-full bg-surface" onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={theme.icons.lg} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <Text className="font-sans text-lg font-bold text-text">Transaction Detail</Text>
        <View className="h-11 w-11" />
      </View>

      <View className="items-center rounded-lg border border-surface-border bg-surface p-5">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons name="receipt-text-outline" size={theme.icons.lg} color={theme.colors.brand.soft} />
        </View>
        <Text className="font-sans text-xl font-bold text-text" numberOfLines={2}>
          {title}
        </Text>
        <CurrencyText value={transaction.amount} currencyCode={currencyCode} locale={locale} className={detailAmountClass(transaction.transactionType)} />
        <Text className="mt-1 font-sans text-sm text-text-muted">{transaction.transactionType}</Text>
      </View>

      <View className="rounded-lg border border-surface-border bg-surface px-4">
        <DetailRow label="Merchant" value={transaction.notes} />
        <DetailRow label="Category" value={transaction.categoryName} />
        <DetailRow label="Account" value={transaction.accountName} />
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Time" value={null} />
        <DetailRow label="Notes" value={transaction.notes} />
        <DetailRow label="Shared" value={transaction.shared ? transaction.sharedVaultName ?? "Shared transaction" : "No"} />
        <DetailRow label="Created" value={transaction.createdAt} />
        <DetailRow label="Updated" value={transaction.updatedAt} />
      </View>

      <EmptyState icon="paperclip" title="No attachments" message="Attachments are not available for this transaction." />

      <View className="gap-3">
        <PrimaryButton onPress={() => router.push(`/transaction/edit/${transaction.id}` as never)}>Edit</PrimaryButton>
        <SecondaryButton onPress={() => setDeleteVisible(true)}>Delete</SecondaryButton>
      </View>

      <BottomSheet visible={deleteVisible} title="Delete Transaction" onClose={() => setDeleteVisible(false)}>
        <View className="gap-4">
          <Text className="font-sans text-sm text-text-muted">
            Delete {title} for <CurrencyText value={transaction.amount} currencyCode={currencyCode} locale={locale} className="text-sm text-text" /> on {dateLabel}?
          </Text>
          <PrimaryButton
            loading={deleteTransaction.isPending}
            disabled={deleteTransaction.isPending}
            onPress={() =>
              deleteTransaction.mutate(transaction.id, {
                onSuccess: () => router.replace("/transactions" as never)
              })
            }
          >
            Delete
          </PrimaryButton>
          <SecondaryButton disabled={deleteTransaction.isPending} onPress={() => setDeleteVisible(false)}>
            Cancel
          </SecondaryButton>
        </View>
      </BottomSheet>
    </Screen>
  );
}
