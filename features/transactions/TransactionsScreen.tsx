import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import { useCategoriesQuery } from "@/features/categories/api";
import { useTransactionMonthRangeQuery, useTransactionsQuery } from "@/features/transactions/api";
import { TransactionTypeIcon } from "@/features/transactions/TransactionTypeIcon";
import { transactionLayout } from "@/features/transactions/transactionLayout";
import { buildMonths, currentMonthKey, groupMonthsByYear, monthLabel, transactionCsvFilename, transactionsToCsv } from "@/features/transactions/transactionHistoryModel";
import type { AccountApi, CategoryApi, TransactionFiltersApi, TransactionHistoryItemApi, TransactionHistorySectionApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

type TransactionTypeFilter = NonNullable<TransactionFiltersApi["transactionType"]>;
type SortFilter = "Newest" | "Oldest" | "Amount High" | "Amount Low";
type ListItem = { key: string; section: TransactionHistorySectionApi; type: "section" } | { item: TransactionHistoryItemApi; key: string; type: "transaction" };
const EMPTY_SECTIONS: TransactionHistorySectionApi[] = [];

interface AdvancedFilters {
  account?: string | undefined;
  amountMax?: string | undefined;
  amountMin?: string | undefined;
  category?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sharedOnly: boolean;
  sortBy: SortFilter;
}

const EMPTY_FILTERS: AdvancedFilters = {
  sharedOnly: false,
  sortBy: "Newest"
};

const typeFilters: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: TransactionTypeFilter }[] = [
  { icon: "view-grid-outline", label: "All" },
  { icon: "arrow-up-circle-outline", label: "Income" },
  { icon: "arrow-down-circle-outline", label: "Expense" },
  { icon: "swap-horizontal", label: "Transfer" }
];

const sortOptions: SortFilter[] = ["Newest", "Oldest", "Amount High", "Amount Low"];

function useDebouncedValue(value: string, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}

function signedPrefix(item: TransactionHistoryItemApi) {
  if (item.direction === "credit") {
    return "+";
  }
  if (item.direction === "debit") {
    return "-";
  }
  return "";
}

function amountClassName(item: TransactionHistoryItemApi) {
  if (item.type === "transfer") {
    return "font-sans text-sm font-bold text-state-info";
  }
  if (item.direction === "credit") {
    return "font-sans text-sm font-bold text-state-success";
  }
  return "font-sans text-sm font-bold text-accent-rose";
}

function activeFilterCount(filters: AdvancedFilters) {
  return [
    filters.account,
    filters.category,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    filters.sharedOnly ? "shared" : "",
    filters.sortBy !== "Newest" ? filters.sortBy : ""
  ].filter(Boolean).length;
}

function TypeChip({ active, icon, label, onPress }: { active: boolean; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: TransactionTypeFilter; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={
        active
          ? "min-h-10 flex-row items-center gap-1.5 rounded-full border border-brand bg-brand px-3"
          : "min-h-10 flex-row items-center gap-1.5 rounded-full border border-surface-border bg-background-muted px-3"
      }
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={active ? theme.colors.text.DEFAULT : theme.colors.text.muted} />
      <Text className={active ? "font-sans text-sm font-semibold text-text" : "font-sans text-sm font-semibold text-text-muted"} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const TransactionRow = memo(function TransactionRow({
  currencyCode,
  item,
  locale,
  onPress
}: {
  currencyCode: string;
  item: TransactionHistoryItemApi;
  locale: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" className={transactionLayout.transactionCardClassName} onPress={onPress}>
      <View className={transactionLayout.transactionRowContentClassName}>
        <View className="mr-3">
          <TransactionTypeIcon item={item} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
              {item.title}
            </Text>
            {item.shared ? (
              <View className={transactionLayout.sharedBadgeClassName}>
                <Text className="font-sans text-[10px] font-semibold text-brand-soft">Shared</Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 font-sans text-sm text-text-muted" numberOfLines={1}>
            {item.type === "transfer" ? "Transfer" : item.category}
          </Text>
          <View className={transactionLayout.accountMetaClassName}>
            <MaterialCommunityIcons name={item.type === "transfer" ? "bank-transfer" : "credit-card-outline"} size={theme.icons.xs} color={theme.colors.brand.soft} />
            <Text className="min-w-0 flex-1 font-sans text-[11px] text-text-muted" numberOfLines={1}>
              {item.account ?? item.transferMetadata?.toAccount ?? "Account"}
            </Text>
          </View>
        </View>
        <View className="ml-2 max-w-32 shrink items-end">
          {item.time ? <Text className="mb-0.5 font-sans text-[11px] text-text-muted">{item.time}</Text> : null}
          <View className="max-w-full flex-row items-center">
            <Text className={amountClassName(item)}>{signedPrefix(item)}</Text>
            <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className={amountClassName(item)} />
          </View>
          {item.runningBalance !== null && item.runningBalance !== undefined ? (
            <Text className={transactionLayout.balanceMetaClassName} numberOfLines={1}>
              Balance <CurrencyText value={item.runningBalance} currencyCode={currencyCode} locale={locale} className="text-[11px] text-text-muted" />
            </Text>
          ) : null}
        </View>
        <View className="ml-2">
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.subtle} />
        </View>
      </View>
      <View className={transactionLayout.transactionDividerClassName} />
    </Pressable>
  );
});

function OptionButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" className={active ? "rounded-full border border-brand bg-brand-deep px-3 py-2" : "rounded-full border border-surface-border bg-surface px-3 py-2"} onPress={onPress}>
      <Text className={active ? "font-sans text-xs font-semibold text-brand-soft" : "font-sans text-xs font-semibold text-text-muted"}>{label}</Text>
    </Pressable>
  );
}

export function TransactionsScreen() {
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);

  return <TransactionsScreenContent key={vaultId ?? "signed-out"} vaultId={vaultId} />;
}

function TransactionsScreenContent({ vaultId }: { vaultId: string | null }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string }>();
  const token = useAuthStore((state) => state.token);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const initialMonth = typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonthKey();
  const [month, setMonth] = useState(initialMonth);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>("All");
  const [filters, setFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const monthRangeQuery = useTransactionMonthRangeQuery(token, vaultId);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const months = useMemo(() => buildMonths(monthRangeQuery.data?.oldestMonth, monthRangeQuery.data?.latestMonth), [monthRangeQuery.data]);
  const monthGroups = useMemo(() => groupMonthsByYear(months, locale), [locale, months]);
  const selectedMonth = months.includes(month) ? month : months[0] ?? currentMonthKey();
  const transactionFilters = useMemo<TransactionFiltersApi>(() => {
    const trimmedSearch = debouncedSearch.trim();
    return {
      ...(filters.account ? { account: filters.account } : {}),
      ...(filters.amountMax ? { amountMax: filters.amountMax } : {}),
      ...(filters.amountMin ? { amountMin: filters.amountMin } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
      ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
      month: selectedMonth,
      ...(trimmedSearch ? { search: trimmedSearch } : {}),
      ...(filters.sharedOnly ? { sharedOnly: true } : {}),
      sortBy: filters.sortBy,
      transactionType
    };
  }, [debouncedSearch, filters, selectedMonth, transactionType]);
  const transactionsQuery = useTransactionsQuery(token, vaultId, transactionFilters);
  const filterCount = activeFilterCount(filters);
  const hasActiveFilters = Boolean(search.trim()) || transactionType !== "All" || filterCount > 0;
  const sections = transactionsQuery.data?.sections ?? EMPTY_SECTIONS;
  const listData = useMemo<ListItem[]>(
    () =>
      sections.flatMap((section) => [
        { key: `section:${section.date}`, section, type: "section" as const },
        ...section.transactions.map((item) => ({ item, key: `transaction:${item.id}`, type: "transaction" as const }))
      ]),
    [sections]
  );

  const clearAll = () => {
    setSearch("");
    setTransactionType("All");
    setFilters(EMPTY_FILTERS);
  };

  const exportCsv = async () => {
    const filename = transactionCsvFilename(selectedMonth);
    const csv = transactionsToCsv(sections);
    await Share.share({
      message: `${filename}\n\n${csv}`,
      title: filename
    });
    setExportVisible(false);
  };

  const listHeader = (
    <View className="gap-3 pt-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-sans text-4xl font-bold text-text">Transactions</Text>
          <Pressable accessibilityRole="button" className="flex-row items-center gap-1.5 self-start" onPress={() => setMonthPickerVisible(true)}>
            <Text className="font-sans text-lg font-semibold text-brand-soft">{monthLabel(selectedMonth, locale)}</Text>
            <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.brand.soft} />
          </Pressable>
        </View>
        <Pressable accessibilityLabel="More transaction actions" accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-surface" onPress={() => setExportVisible(true)}>
          <MaterialCommunityIcons name="dots-vertical" size={theme.icons.md} color={theme.colors.text.muted} />
        </Pressable>
      </View>

      <View className="min-h-14 flex-row items-center gap-3 rounded-lg border border-surface-border bg-background-muted px-4">
        <MaterialCommunityIcons name="magnify" size={theme.icons.md} color={theme.colors.text.muted} />
        <TextInput
          accessibilityLabel="Search transactions"
          className="h-12 min-w-0 flex-1 py-0 font-sans text-base leading-6 text-text"
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor={theme.colors.text.muted}
          textAlignVertical="center"
          value={search}
        />
        {search ? (
          <Pressable accessibilityLabel="Clear transaction search" accessibilityRole="button" onPress={() => setSearch("")}>
            <MaterialCommunityIcons name="close-circle" size={theme.icons.sm} color={theme.colors.text.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal contentContainerClassName={transactionLayout.chipRowClassName} showsHorizontalScrollIndicator={false}>
        {typeFilters.map((filter) => (
          <TypeChip key={filter.label} active={transactionType === filter.label} icon={filter.icon} label={filter.label} onPress={() => setTransactionType(filter.label)} />
        ))}
        <Pressable accessibilityRole="button" className="min-h-10 flex-row items-center gap-1.5 rounded-full border border-surface-border bg-background-muted px-3" onPress={() => setFilterVisible(true)}>
          <MaterialCommunityIcons name="filter-variant" size={theme.icons.sm} color={theme.colors.text.muted} />
          <Text className="font-sans text-sm font-semibold text-text-muted" numberOfLines={1}>
            Filters{filterCount > 0 ? ` ${filterCount}` : ""}
          </Text>
        </Pressable>
      </ScrollView>

      {hasActiveFilters ? (
        <View className="flex-row justify-end">
          <Pressable accessibilityRole="button" onPress={clearAll}>
            <Text className="font-sans text-sm font-semibold text-brand-soft">Clear all</Text>
          </Pressable>
        </View>
      ) : null}

      {transactionsQuery.isLoading ? (
        <>
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </>
      ) : null}
      {transactionsQuery.isError ? <ErrorView message="Transactions could not be loaded." onRetry={() => transactionsQuery.refetch()} /> : null}
      {!transactionsQuery.isLoading && !transactionsQuery.isError && sections.length === 0 ? (
        <EmptyState icon="swap-horizontal" title="No transactions" message="Transactions for this month will appear here." />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} contentClassName="flex-1 gap-0 px-0 pb-0 pt-0">
      <FlatList
        data={transactionsQuery.isError ? [] : listData}
        initialNumToRender={18}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={listHeader}
        maxToRenderPerBatch={18}
        onRefresh={() => transactionsQuery.refetch()}
        refreshing={transactionsQuery.isRefetching}
        renderItem={({ item }) => {
          if (item.type === "section") {
            return (
              <View className={transactionLayout.dateHeaderClassName}>
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
                  <Text className="font-sans text-base font-semibold text-text">{item.section.label}</Text>
                </View>
                {item.section.summary ? (
                  <Text className={item.section.received > item.section.spent ? "font-sans text-sm font-semibold text-state-success" : "font-sans text-sm font-semibold text-accent-rose"}>
                    {item.section.summary}
                  </Text>
                ) : null}
              </View>
            );
          }

          return (
            <View className={transactionLayout.rowContainerClassName}>
              <TransactionRow
                item={item.item}
                currencyCode={currencyCode}
                locale={locale}
                onPress={() => router.push(`/transaction/${item.item.transactionId ?? item.item.id}` as never)}
              />
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        contentContainerClassName={`${transactionLayout.pagePaddingClassName} ${transactionLayout.bottomPaddingClassName}`}
      />

      <BottomSheet visible={monthPickerVisible} title="Select Month" onClose={() => setMonthPickerVisible(false)}>
        <View className="gap-4">
          {monthGroups.map((group) => (
            <View key={group.year} className="gap-2">
              <Text className="font-sans text-sm font-bold text-text-muted">{group.year}</Text>
              <View className="overflow-hidden rounded-lg border border-surface-border bg-surface px-3">
                {group.months.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center justify-between border-b border-surface-border py-3 last:border-b-0"
                    onPress={() => {
                      setMonth(option.value);
                      setMonthPickerVisible(false);
                    }}
                  >
                    <Text className="font-sans text-sm font-semibold text-text">{option.label}</Text>
                    {option.value === selectedMonth ? <MaterialCommunityIcons name="check" size={theme.icons.sm} color={theme.colors.brand.soft} /> : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={filterVisible} title="Filters" onClose={() => setFilterVisible(false)}>
        <View className="gap-4">
          <FilterOptions title="Account" options={(accountsQuery.data ?? []).map((account: AccountApi) => account.name)} value={filters.account} onSelect={(account) => setFilters((current) => ({ ...current, account }))} />
          <FilterOptions title="Category" options={(categoriesQuery.data ?? []).map((category: CategoryApi) => category.name)} value={filters.category} onSelect={(category) => setFilters((current) => ({ ...current, category }))} />
          <FilterInput label="From Date" placeholder="YYYY-MM-DD" value={filters.dateFrom ?? ""} onChangeText={(dateFrom) => setFilters((current) => ({ ...current, ...(dateFrom ? { dateFrom } : { dateFrom: undefined }) }))} />
          <FilterInput label="To Date" placeholder="YYYY-MM-DD" value={filters.dateTo ?? ""} onChangeText={(dateTo) => setFilters((current) => ({ ...current, ...(dateTo ? { dateTo } : { dateTo: undefined }) }))} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FilterInput label="Min Amount" placeholder="0" value={filters.amountMin ?? ""} onChangeText={(amountMin) => setFilters((current) => ({ ...current, ...(amountMin ? { amountMin } : { amountMin: undefined }) }))} />
            </View>
            <View className="flex-1">
              <FilterInput label="Max Amount" placeholder="0" value={filters.amountMax ?? ""} onChangeText={(amountMax) => setFilters((current) => ({ ...current, ...(amountMax ? { amountMax } : { amountMax: undefined }) }))} />
            </View>
          </View>
          <View className="gap-2">
            <Text className="font-sans text-sm font-semibold text-text">Sort</Text>
            <View className="flex-row flex-wrap gap-2">
              {sortOptions.map((sortBy) => (
                <OptionButton key={sortBy} active={filters.sortBy === sortBy} label={sortBy} onPress={() => setFilters((current) => ({ ...current, sortBy }))} />
              ))}
            </View>
          </View>
          <OptionButton active={filters.sharedOnly} label="Shared only" onPress={() => setFilters((current) => ({ ...current, sharedOnly: !current.sharedOnly }))} />
          <View className="flex-row gap-3">
            <SecondaryButton className="flex-1" onPress={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </SecondaryButton>
            <PrimaryButton className="flex-1" onPress={() => setFilterVisible(false)}>
              Apply
            </PrimaryButton>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet visible={exportVisible} title="Transactions" onClose={() => setExportVisible(false)}>
        <View className="gap-3">
          <PrimaryButton icon="file-delimited-outline" disabled={sections.length === 0} onPress={exportCsv}>
            Export CSV
          </PrimaryButton>
          <SecondaryButton onPress={() => setExportVisible(false)}>Cancel</SecondaryButton>
        </View>
      </BottomSheet>
    </Screen>
  );
}

function FilterInput({ label, onChangeText, placeholder, value }: { label: string; onChangeText: (value: string) => void; placeholder: string; value: string }) {
  return (
    <View className="gap-1.5">
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
      <TextInput
        className="h-11 rounded-md border border-surface-border bg-background px-3 font-sans text-sm text-text"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        value={value}
      />
    </View>
  );
}

function FilterOptions({ onSelect, options, title, value }: { onSelect: (value: string | undefined) => void; options: string[]; title: string; value?: string | undefined }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-sm font-semibold text-text">{title}</Text>
        {value ? (
          <Pressable accessibilityRole="button" onPress={() => onSelect(undefined)}>
            <Text className="font-sans text-xs font-semibold text-brand-soft">Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {options.slice(0, 16).map((option) => (
          <OptionButton key={option} active={value === option} label={option} onPress={() => onSelect(value === option ? undefined : option)} />
        ))}
      </View>
    </View>
  );
}
