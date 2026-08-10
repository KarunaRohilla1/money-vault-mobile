import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import { Pressable, SectionList, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton } from "@/components/ui";
import { useSharedExpensesQuery } from "@/features/shared/api";
import { sharedRoutes } from "@/features/shared/routes";
import { resolveSharedActivityIcon } from "@/features/shared/sharedDashboardModel";
import { filterSharedExpenses, groupSharedExpenses, type SharedTransactionListItem, type SharedTransactionSection } from "@/features/shared/sharedTransactionsModel";
import { transactionLayout } from "@/features/transactions/transactionLayout";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

const EMPTY_SECTIONS: SharedTransactionSection[] = [];

const SharedTransactionRow = memo(function SharedTransactionRow({
  currencyCode,
  item,
  locale,
  onPress
}: {
  currencyCode: string;
  item: SharedTransactionListItem;
  locale: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" className={transactionLayout.transactionCardClassName} onPress={onPress}>
      <View className={transactionLayout.transactionRowContentClassName}>
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-brand-deep">
          <MaterialCommunityIcons name={item.icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="mt-1 font-sans text-xs text-text-muted" numberOfLines={1}>
            {item.paidByLabel}
          </Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
            {item.splitLabel}
          </Text>
        </View>
        <View className="ml-3 items-end">
          <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-bold text-text" />
          <Text className="mt-1 font-sans text-xs text-text-muted">{item.dateLabel}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.subtle} />
      </View>
    </Pressable>
  );
});

export function SharedTransactionsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [search, setSearch] = useState("");
  const expensesQuery = useSharedExpensesQuery(token, vaultId);
  const summary = expensesQuery.data?.data?.summary;
  const filteredExpenses = useMemo(
    () => filterSharedExpenses(expensesQuery.data?.data?.expenses ?? [], search),
    [expensesQuery.data?.data?.expenses, search]
  );
  const sections = useMemo(
    () => (expensesQuery.data ? groupSharedExpenses(filteredExpenses, locale, resolveSharedActivityIcon) : EMPTY_SECTIONS),
    [expensesQuery.data, filteredExpenses, locale]
  );
  const hasSearch = search.trim().length > 0;

  const listHeader = (
    <View className="gap-3 pt-4">
      <View className="gap-1">
        <Text className="font-sans text-4xl font-bold text-text">Transactions</Text>
        <Text className="font-sans text-lg font-semibold text-brand-soft">Shared vault expenses</Text>
        {summary ? (
          <Text className="font-sans text-sm text-text-muted">
            {summary.total_transactions} transactions · {summary.total_shared_spend.toLocaleString(locale)} total shared spend
          </Text>
        ) : null}
      </View>

      <View className="min-h-14 flex-row items-center gap-3 rounded-lg border border-surface-border bg-background-muted px-4">
        <MaterialCommunityIcons name="magnify" size={theme.icons.md} color={theme.colors.text.muted} />
        <TextInput
          accessibilityLabel="Search shared transactions"
          className="h-12 min-w-0 flex-1 py-0 font-sans text-base leading-6 text-text"
          onChangeText={setSearch}
          placeholder="Search shared transactions..."
          placeholderTextColor={theme.colors.text.muted}
          textAlignVertical="center"
          value={search}
        />
        {search ? (
          <Pressable accessibilityLabel="Clear shared transaction search" accessibilityRole="button" onPress={() => setSearch("")}>
            <MaterialCommunityIcons name="close-circle" size={theme.icons.sm} color={theme.colors.text.muted} />
          </Pressable>
        ) : null}
      </View>

      {expensesQuery.isLoading ? (
        <>
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </>
      ) : null}
      {expensesQuery.isError ? <ErrorView message="Shared transactions could not be loaded." onRetry={() => expensesQuery.refetch()} /> : null}
      {!expensesQuery.isLoading && !expensesQuery.isError && sections.length === 0 ? (
        <EmptyState
          icon="receipt-text-outline"
          title={hasSearch ? "No transactions match your search" : "No shared expenses yet"}
          message={hasSearch ? "Try a different search term." : "Shared expenses for this cycle will appear here."}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} contentClassName={transactionLayout.pageClassName}>
      <SectionList
        sections={expensesQuery.isError ? [] : sections}
        initialNumToRender={18}
        keyExtractor={(item) => `shared-transaction:${item.id}`}
        ListHeaderComponent={listHeader}
        maxToRenderPerBatch={18}
        onRefresh={() => expensesQuery.refetch()}
        refreshing={expensesQuery.isRefetching}
        renderSectionHeader={({ section }) => (
          <View className={transactionLayout.dateHeaderClassName}>
            <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
              <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
              <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
                {section.label}
              </Text>
            </View>
          </View>
        )}
        renderSectionFooter={() => <View className={transactionLayout.sectionFooterDividerClassName} />}
        renderItem={({ item }) => (
          <View className={transactionLayout.rowContainerClassName}>
            <SharedTransactionRow
              currencyCode={currencyCode}
              item={item}
              locale={locale}
              onPress={() => router.push(sharedRoutes.transaction(item.id) as never)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        contentContainerClassName={transactionLayout.listContentClassName}
      />
    </Screen>
  );
}
