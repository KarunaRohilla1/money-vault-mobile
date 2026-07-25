import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, SectionList, Share, Switch, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import { useCategoriesQuery } from "@/features/categories/api";
import { useTransactionMonthRangeQuery, useTransactionsQuery } from "@/features/transactions/api";
import { TransactionTypeIcon } from "@/features/transactions/TransactionTypeIcon";
import { transactionLayout } from "@/features/transactions/transactionLayout";
import {
  activeFilterCount,
  applyDatePreset,
  clearFilters,
  cloneFilters,
  dedupeCategoriesById,
  EMPTY_FILTERS,
  formatDisplayDate,
  filterCategoriesForSearch,
  filterValidationError,
  selectedCategories,
  sortOptions,
  toApiFilters,
  toggleId,
  transactionDisplayText,
  type AdvancedFilters,
  type DatePreset,
  type TransactionTypeFilter
} from "@/features/transactions/transactionFilterModel";
import { buildMonths, currentMonthKey, groupMonthsByYear, monthLabel, transactionCsvFilename, transactionsToCsv } from "@/features/transactions/transactionHistoryModel";
import type { AccountApi, CategoryApi, TransactionFiltersApi, TransactionHistoryItemApi, TransactionHistorySectionApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

const EMPTY_SECTIONS: TransactionHistorySectionApi[] = [];
const EMPTY_ACCOUNTS: AccountApi[] = [];
const EMPTY_CATEGORIES: CategoryApi[] = [];
type TransactionSection = TransactionHistorySectionApi & { data: TransactionHistoryItemApi[] };

const typeFilters: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: TransactionTypeFilter }[] = [
  { icon: "view-grid-outline", label: "All" },
  { icon: "arrow-up-circle-outline", label: "Income" },
  { icon: "arrow-down-circle-outline", label: "Expense" },
  { icon: "swap-horizontal", label: "Transfer" }
];

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
  const display = transactionDisplayText(item);

  return (
    <Pressable accessibilityRole="button" className={transactionLayout.transactionCardClassName} onPress={onPress}>
      <View className={transactionLayout.transactionRowContentClassName}>
        <View className="mr-3">
          <TransactionTypeIcon item={item} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
              {display.primary}
            </Text>
            {item.shared ? (
              <View className={transactionLayout.sharedBadgeClassName}>
                <Text className="font-sans text-[10px] font-semibold text-brand-soft">Shared</Text>
              </View>
            ) : null}
          </View>
          {display.secondary ? (
            <Text className="mt-0.5 font-sans text-sm text-text-muted" numberOfLines={1}>
              {display.secondary}
            </Text>
          ) : null}
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
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [draftTransactionType, setDraftTransactionType] = useState<TransactionTypeFilter>("All");
  const [filterVisible, setFilterVisible] = useState(false);
  const [categorySelectorVisible, setCategorySelectorVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const monthRangeQuery = useTransactionMonthRangeQuery(token, vaultId);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const categoriesQuery = useCategoriesQuery(token, vaultId);
  const accounts = accountsQuery.data ?? EMPTY_ACCOUNTS;
  const categories = useMemo(() => dedupeCategoriesById(categoriesQuery.data ?? EMPTY_CATEGORIES), [categoriesQuery.data]);
  const months = useMemo(() => buildMonths(monthRangeQuery.data?.oldestMonth, monthRangeQuery.data?.latestMonth), [monthRangeQuery.data]);
  const monthGroups = useMemo(() => groupMonthsByYear(months, locale), [locale, months]);
  const selectedMonth = months.includes(month) ? month : months[0] ?? currentMonthKey();
  const transactionFilters = useMemo<TransactionFiltersApi>(
    () =>
      toApiFilters({
        accounts,
        categories,
        filters,
        month: selectedMonth,
        search: debouncedSearch,
        transactionType
      }),
    [accounts, categories, debouncedSearch, filters, selectedMonth, transactionType]
  );
  const transactionsQuery = useTransactionsQuery(token, vaultId, transactionFilters);
  const filterCount = activeFilterCount(filters, transactionType);
  const draftFilterCount = activeFilterCount(draftFilters, draftTransactionType);
  const draftValidationError = filterValidationError(draftFilters);
  const hasActiveFilters = Boolean(search.trim()) || filterCount > 0;
  const sections = transactionsQuery.data?.sections ?? EMPTY_SECTIONS;
  const listSections = useMemo<TransactionSection[]>(() => sections.map((section) => ({ ...section, data: section.transactions })), [sections]);

  const clearAll = () => {
    setSearch("");
    setTransactionType("All");
    setFilters(clearFilters());
  };

  const openFilters = () => {
    setDraftFilters(cloneFilters(filters));
    setDraftTransactionType(transactionType);
    setCategorySearch("");
    setFilterVisible(true);
  };

  const closeFilters = () => {
    setFilterVisible(false);
    setCategorySelectorVisible(false);
  };

  const applyFilters = () => {
    if (draftValidationError) {
      return;
    }

    setFilters(cloneFilters(draftFilters));
    setTransactionType(draftTransactionType);
    closeFilters();
  };

  const clearDraftFilters = () => {
    setDraftFilters(clearFilters());
    setDraftTransactionType("All");
    setCategorySearch("");
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
        <Pressable accessibilityRole="button" className="min-h-10 flex-row items-center gap-1.5 rounded-full border border-surface-border bg-background-muted px-3" onPress={openFilters}>
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
        <View className="gap-3">
          <EmptyState
            icon="swap-horizontal"
            title={hasActiveFilters ? "No transactions match these filters" : "No transactions"}
            message={hasActiveFilters ? "Clear filters to see more transactions." : "Transactions for this month will appear here."}
          />
          {hasActiveFilters ? <SecondaryButton onPress={clearAll}>Clear filters</SecondaryButton> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} contentClassName={transactionLayout.pageClassName}>
      <SectionList
        sections={transactionsQuery.isError ? [] : listSections}
        initialNumToRender={18}
        keyExtractor={(item) => `transaction:${item.id}`}
        ListHeaderComponent={listHeader}
        maxToRenderPerBatch={18}
        onRefresh={() => transactionsQuery.refetch()}
        refreshing={transactionsQuery.isRefetching}
        renderSectionHeader={({ section }) => (
          <View className={transactionLayout.dateHeaderClassName}>
            <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
              <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
              <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
                {section.label}
              </Text>
            </View>
            {section.summary ? (
              <Text className={section.received > section.spent ? "ml-3 font-sans text-sm font-semibold text-state-success" : "ml-3 font-sans text-sm font-semibold text-accent-rose"} numberOfLines={1}>
                {section.summary}
              </Text>
            ) : null}
          </View>
        )}
        renderSectionFooter={() => <View className={transactionLayout.sectionFooterDividerClassName} />}
        renderItem={({ item }) => (
          <View className={transactionLayout.rowContainerClassName}>
            <TransactionRow
              item={item}
              currencyCode={currencyCode}
              locale={locale}
              onPress={() => router.push(`/transaction/${item.transactionId ?? item.id}` as never)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        contentContainerClassName={transactionLayout.listContentClassName}
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

      <TransactionFilterSheet
        accounts={accounts}
        categories={categories}
        draftFilters={draftFilters}
        draftTransactionType={draftTransactionType}
        filterCount={draftFilterCount}
        locale={locale}
        selectedMonth={selectedMonth}
        validationError={draftValidationError}
        visible={filterVisible}
        onApply={applyFilters}
        onClear={clearDraftFilters}
        onClose={closeFilters}
        onOpenCategorySelector={() => setCategorySelectorVisible(true)}
        onSetDraftFilters={setDraftFilters}
        onSetDraftTransactionType={setDraftTransactionType}
      />

      <CategorySelectorModal
        categories={categories}
        search={categorySearch}
        selectedIds={draftFilters.categoryIds}
        visible={categorySelectorVisible}
        onChangeSearch={setCategorySearch}
        onClear={() => setDraftFilters((current) => ({ ...current, categoryIds: [] }))}
        onClose={() => setCategorySelectorVisible(false)}
        onToggle={(categoryId) => setDraftFilters((current) => ({ ...current, categoryIds: toggleId(current.categoryIds, categoryId) }))}
      />

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

function TransactionFilterSheet({
  accounts,
  categories,
  draftFilters,
  draftTransactionType,
  filterCount,
  locale,
  onApply,
  onClear,
  onClose,
  onOpenCategorySelector,
  onSetDraftFilters,
  onSetDraftTransactionType,
  selectedMonth,
  validationError,
  visible
}: {
  accounts: AccountApi[];
  categories: CategoryApi[];
  draftFilters: AdvancedFilters;
  draftTransactionType: TransactionTypeFilter;
  filterCount: number;
  locale: string;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  onOpenCategorySelector: () => void;
  onSetDraftFilters: (updater: (current: AdvancedFilters) => AdvancedFilters) => void;
  onSetDraftTransactionType: (value: TransactionTypeFilter) => void;
  selectedMonth: string;
  validationError: string | null;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keyboardBehavior = Platform.OS === "ios" ? "padding" : "height";
  const selected = selectedCategories(categories, draftFilters.categoryIds);
  const availableHeight = Math.max(360, height - insets.top - 16);
  const sheetHeight = Math.min(availableHeight, Math.max(520, Math.floor(height * 0.86)));

  const applyPreset = (preset: DatePreset) => {
    onSetDraftFilters((current) => applyDatePreset(current, preset, selectedMonth));
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={keyboardBehavior} className="flex-1 justify-end bg-background-inset/80">
        <Pressable className="flex-1" onPress={onClose} />
        <SafeAreaView edges={["bottom"]} className="rounded-t-xl border border-surface-border bg-surface-raised" style={{ height: sheetHeight }}>
          <View className="flex-row items-center justify-between border-b border-surface-border px-5 py-4">
            <View className="gap-0.5">
              <Text className="font-sans text-xl font-bold text-text">Filters</Text>
              <Text className="font-sans text-xs text-text-muted">{filterCount > 0 ? `${filterCount} active` : "No filters applied"}</Text>
            </View>
            <Pressable accessibilityLabel="Close filters" accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-background-muted" onPress={onClose}>
              <MaterialCommunityIcons name="close" size={theme.icons.md} color={theme.colors.text.muted} />
            </Pressable>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <FilterSection title="FILTER BY">
              <View className="flex-row flex-wrap gap-2">
                <OptionButton active={draftTransactionType === "Expense"} label="Expenses" onPress={() => onSetDraftTransactionType(draftTransactionType === "Expense" ? "All" : "Expense")} />
                <OptionButton active={draftTransactionType === "Income"} label="Income" onPress={() => onSetDraftTransactionType(draftTransactionType === "Income" ? "All" : "Income")} />
                <OptionButton active={draftFilters.sharedOnly} label="Shared" onPress={() => onSetDraftFilters((current) => ({ ...current, sharedOnly: !current.sharedOnly }))} />
              </View>
            </FilterSection>

            <FilterSection title="Accounts">
              <View className="flex-row flex-wrap gap-2">
                <OptionButton active={draftFilters.accountIds.length === 0} label="All accounts" onPress={() => onSetDraftFilters((current) => ({ ...current, accountIds: [] }))} />
                {accounts.map((account) => {
                  const id = String(account.id);
                  const active = draftFilters.accountIds.includes(id);

                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      className={active ? "min-h-10 flex-row items-center gap-1.5 rounded-full border border-brand bg-brand-deep px-3 py-2" : "min-h-10 flex-row items-center rounded-full border border-surface-border bg-background-muted px-3 py-2"}
                      onPress={() => onSetDraftFilters((current) => ({ ...current, accountIds: toggleId(current.accountIds, id) }))}
                    >
                      {active ? <MaterialCommunityIcons name="check" size={theme.icons.xs} color={theme.colors.brand.soft} /> : null}
                      <Text className={active ? "font-sans text-xs font-semibold text-brand-soft" : "font-sans text-xs font-semibold text-text-muted"} numberOfLines={1}>
                        {account.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FilterSection>

            <FilterSection title="Categories">
              <Pressable accessibilityRole="button" className="min-h-12 flex-row items-center justify-between rounded-lg border border-surface-border bg-background-muted px-4 py-3" onPress={onOpenCategorySelector}>
                <Text className="font-sans text-sm font-semibold text-text">{selected.length > 0 ? `${selected.length} selected` : "Select categories"}</Text>
                <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.muted} />
              </Pressable>
              {selected.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {selected.map((category) => (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      className="min-h-9 flex-row items-center gap-1.5 rounded-full border border-brand-muted bg-brand-deep/50 px-3"
                      onPress={() => onSetDraftFilters((current) => ({ ...current, categoryIds: toggleId(current.categoryIds, String(category.id)) }))}
                    >
                      <Text className="font-sans text-xs font-semibold text-brand-soft">{category.name}</Text>
                      <MaterialCommunityIcons name="close" size={theme.icons.xs} color={theme.colors.brand.soft} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </FilterSection>

            <FilterSection title="Date range">
              <View className="flex-row flex-wrap gap-2">
                {(["This month", "Last month", "Last 30 days", "Custom"] satisfies DatePreset[]).map((preset) => (
                  <OptionButton key={preset} active={false} label={preset} onPress={() => applyPreset(preset)} />
                ))}
              </View>
              <View className="mt-3 flex-row gap-3">
                <DateInput label="From" locale={locale} value={draftFilters.dateFrom} onChangeText={(dateFrom) => onSetDraftFilters((current) => ({ ...current, dateFrom }))} />
                <DateInput label="To" locale={locale} value={draftFilters.dateTo} onChangeText={(dateTo) => onSetDraftFilters((current) => ({ ...current, dateTo }))} />
              </View>
            </FilterSection>

            <FilterSection title="Amount range">
              <View className="flex-row gap-3">
                <AmountInput label="Minimum" value={draftFilters.amountMin} onChangeText={(amountMin) => onSetDraftFilters((current) => ({ ...current, amountMin }))} />
                <AmountInput label="Maximum" value={draftFilters.amountMax} onChangeText={(amountMax) => onSetDraftFilters((current) => ({ ...current, amountMax }))} />
              </View>
            </FilterSection>

            <FilterSection title="DISPLAY">
              <View className="overflow-hidden rounded-lg border border-surface-border bg-background-muted">
                {sortOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center justify-between border-b border-surface-border px-4 py-3 last:border-b-0"
                    onPress={() => onSetDraftFilters((current) => ({ ...current, sortBy: option.value }))}
                  >
                    <Text className="font-sans text-sm font-semibold text-text">{option.label}</Text>
                    {draftFilters.sortBy === option.value ? <MaterialCommunityIcons name="radiobox-marked" size={theme.icons.sm} color={theme.colors.brand.soft} /> : <MaterialCommunityIcons name="radiobox-blank" size={theme.icons.sm} color={theme.colors.text.subtle} />}
                  </Pressable>
                ))}
              </View>

              <View className="min-h-12 flex-row items-center justify-between rounded-lg border border-surface-border bg-background-muted px-4 py-3">
                <View>
                  <Text className="font-sans text-sm font-semibold text-text">Shared only</Text>
                  <Text className="font-sans text-xs text-text-muted">Show shared transactions</Text>
                </View>
                <Switch value={draftFilters.sharedOnly} onValueChange={(sharedOnly) => onSetDraftFilters((current) => ({ ...current, sharedOnly }))} />
              </View>
            </FilterSection>

            {validationError ? <Text className="font-sans text-sm font-semibold text-accent-rose">{validationError}</Text> : null}
          </ScrollView>

          <View className="flex-row gap-3 border-t border-surface-border px-5 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
            <SecondaryButton className="flex-1" onPress={onClear}>
              Clear all
            </SecondaryButton>
            <PrimaryButton className="flex-1" disabled={Boolean(validationError)} onPress={onApply}>
              Apply{filterCount > 0 ? ` (${filterCount})` : ""}
            </PrimaryButton>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FilterSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold uppercase tracking-wide text-text-muted">{title}</Text>
      {children}
    </View>
  );
}

function DateInput({ label, locale, onChangeText, value }: { label: string; locale: string; onChangeText: (value: string) => void; value: string }) {
  return (
    <View className="flex-1 gap-1.5">
      <Text className="font-sans text-xs font-semibold text-text-muted">{label}</Text>
      <View className="min-h-12 rounded-lg border border-surface-border bg-background-muted px-3 py-2">
        <TextInput
          accessibilityLabel={`${label} date`}
          className="h-6 py-0 font-sans text-sm text-text"
          onChangeText={onChangeText}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.text.muted}
          value={value}
        />
        {value ? <Text className="font-sans text-[11px] text-text-muted">{formatDisplayDate(value, locale)}</Text> : null}
      </View>
    </View>
  );
}

function AmountInput({ label, onChangeText, value }: { label: string; onChangeText: (value: string) => void; value: string }) {
  return (
    <View className="flex-1 gap-1.5">
      <Text className="font-sans text-xs font-semibold text-text-muted">{label}</Text>
      <TextInput
        accessibilityLabel={`${label} amount`}
        className="min-h-12 rounded-lg border border-surface-border bg-background-muted px-3 font-sans text-sm text-text"
        inputMode="decimal"
        keyboardType="decimal-pad"
        onChangeText={onChangeText}
        placeholder={label === "Minimum" ? "Minimum ₹" : "Maximum ₹"}
        placeholderTextColor={theme.colors.text.muted}
        value={value}
      />
    </View>
  );
}

function CategorySelectorModal({
  categories,
  onChangeSearch,
  onClear,
  onClose,
  onToggle,
  search,
  selectedIds,
  visible
}: {
  categories: CategoryApi[];
  onChangeSearch: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  onToggle: (categoryId: string) => void;
  search: string;
  selectedIds: string[];
  visible: boolean;
}) {
  const filtered = filterCategoriesForSearch(categories, search);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={["top", "right", "bottom", "left"]}>
        <View className="flex-row items-center justify-between border-b border-surface-border px-5 py-4">
          <View>
            <Text className="font-sans text-xl font-bold text-text">Categories</Text>
            <Text className="font-sans text-xs text-text-muted">{selectedIds.length > 0 ? `${selectedIds.length} selected` : "Choose one or more"}</Text>
          </View>
          <Pressable accessibilityLabel="Close category selector" accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-surface" onPress={onClose}>
            <MaterialCommunityIcons name="close" size={theme.icons.md} color={theme.colors.text.muted} />
          </Pressable>
        </View>

        <View className="gap-3 px-5 py-4">
          <View className="min-h-12 flex-row items-center gap-3 rounded-lg border border-surface-border bg-background-muted px-4">
            <MaterialCommunityIcons name="magnify" size={theme.icons.sm} color={theme.colors.text.muted} />
            <TextInput
              accessibilityLabel="Search categories"
              className="h-11 min-w-0 flex-1 py-0 font-sans text-base text-text"
              onChangeText={onChangeSearch}
              placeholder="Search categories..."
              placeholderTextColor={theme.colors.text.muted}
              value={search}
            />
          </View>
          {selectedIds.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={onClear}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">Clear categories</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
          <View className="overflow-hidden rounded-lg border border-surface-border bg-surface">
            {filtered.map((category) => {
              const id = String(category.id);
              const active = selectedIds.includes(id);

              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  className="min-h-12 flex-row items-center justify-between border-b border-surface-border px-4 py-3 last:border-b-0"
                  onPress={() => onToggle(id)}
                >
                  <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-text" numberOfLines={1}>
                    {category.name}
                  </Text>
                  {active ? <MaterialCommunityIcons name="check" size={theme.icons.sm} color={theme.colors.brand.soft} /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
