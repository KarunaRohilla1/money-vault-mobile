import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import {
  useCreateTransferMutation,
  useDeleteTransferMutation,
  useTransfersQuery,
  useUpdateTransferMutation
} from "@/features/transfers/api";
import {
  activeTransferFilterCount,
  clearTransferFilter,
  clearTransferFilters,
  emptyTransferForm,
  toTransferPayload,
  transferAmountError,
  transferFilterError,
  transferFormFromTransfer,
  transferFormError,
  updateTransferFilter,
  visibleTransferHistory,
  type TransferFilters,
  type TransferFormValues
} from "@/features/transfers/transferModel";
import { formatCurrency } from "@/lib/format";
import { addMonthsToIsoDate, daysInMonth, formatIsoDateOnly, isoDateFromParts, isoDateParts, todayLocalIso } from "@/lib/date";
import { toAppError } from "@/lib/errors";
import type { AccountApi, TransferApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

type FlowMode = "compose" | "review" | "success";
type HistoryMode = "recent" | "all";
type AccountPickerTarget = "from" | "to" | null;
type DatePickerTarget = "transfer" | "filterFrom" | "filterTo" | null;

interface TransferDraft extends TransferFormValues {
  transferGroupId: string | null;
}

function createEmptyDraft(): TransferDraft {
  return {
    ...emptyTransferForm(),
    transferGroupId: null
  };
}

function formatDate(value: string, locale: string) {
  return formatIsoDateOnly(value, locale);
}

function accountIcon(account: Pick<AccountApi, "type">) {
  if (account.type === "Credit Card") {
    return "credit-card-outline" as const;
  }

  if (account.type === "Cash") {
    return "cash" as const;
  }

  return "bank-outline" as const;
}

function accountTone(account: Pick<AccountApi, "type">) {
  if (account.type === "Credit Card") {
    return theme.colors.accent.rose;
  }

  if (account.type === "Cash") {
    return theme.colors.state.warning;
  }

  return theme.colors.brand.soft;
}

function accountBalance(account: AccountApi | null) {
  if (!account || typeof account.balance !== "number") {
    return null;
  }

  return account.balance;
}

function AccountCard({
  account,
  label,
  onPress,
  currencyCode,
  locale
}: {
  account: AccountApi | null;
  currencyCode: string;
  label: string;
  locale: string;
  onPress: () => void;
}) {
  const balance = accountBalance(account);

  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold uppercase text-text-muted">{label}</Text>
      <Pressable
        accessibilityLabel={`Choose ${label.toLowerCase()} account`}
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3"
        onPress={onPress}
      >
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-brand-deep">
          <MaterialCommunityIcons name={account ? accountIcon(account) : "bank-outline"} size={theme.icons.md} color={account ? accountTone(account) : theme.colors.brand.soft} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
            {account?.name ?? "Choose account"}
          </Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
            {account?.type ?? "Account"}
          </Text>
        </View>
        <View className="max-w-28 items-end pr-1">
          {balance === null ? (
            <Text className="text-right font-sans text-xs text-text-muted" numberOfLines={2}>
              Balance unavailable
            </Text>
          ) : (
            <>
              <Text className="font-sans text-sm font-semibold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {formatCurrency(balance, currencyCode, locale)}
              </Text>
              <Text className="font-sans text-xs text-text-muted">Balance</Text>
            </>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
      </Pressable>
    </View>
  );
}

function DateField({
  label,
  locale,
  onClear,
  onPress,
  value
}: {
  label: string;
  locale: string;
  onClear?: () => void;
  onPress: () => void;
  value: string | null | undefined;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold uppercase text-text-muted">{label}</Text>
      <Pressable
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3"
        onPress={onPress}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
        <Text className={value ? "flex-1 font-sans text-sm font-semibold text-text" : "flex-1 font-sans text-sm text-text-muted"}>
          {value ? formatDate(value, locale) : "Select date"}
        </Text>
        {value && onClear ? (
          <Pressable accessibilityLabel={`Clear ${label.toLowerCase()}`} accessibilityRole="button" hitSlop={8} onPress={onClear}>
            <MaterialCommunityIcons name="close-circle" size={theme.icons.sm} color={theme.colors.text.muted} />
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

function FilterAccountField({
  account,
  onClear,
  onPress
}: {
  account: AccountApi | null;
  onClear: () => void;
  onPress: () => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold uppercase text-text-muted">Account Involved</Text>
      <Pressable
        accessibilityLabel="Choose account filter"
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background px-4 py-3"
        onPress={onPress}
      >
        <MaterialCommunityIcons name="bank-transfer" size={theme.icons.sm} color={theme.colors.brand.soft} />
        <View className="flex-1">
          <Text className={account ? "font-sans text-sm font-semibold text-text" : "font-sans text-sm text-text-muted"} numberOfLines={1}>
            {account?.name ?? "All accounts"}
          </Text>
          <Text className="font-sans text-xs text-text-muted">{account?.type ?? "Source or destination"}</Text>
        </View>
        {account ? (
          <Pressable accessibilityLabel="Clear account filter" accessibilityRole="button" hitSlop={8} onPress={onClear}>
            <MaterialCommunityIcons name="close-circle" size={theme.icons.sm} color={theme.colors.text.muted} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
        )}
      </Pressable>
    </View>
  );
}

function MonthDatePicker({
  locale,
  onCancel,
  onConfirm,
  selectedDate,
  setSelectedDate
}: {
  locale: string;
  onCancel: () => void;
  onConfirm: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const parts = isoDateParts(selectedDate) ?? isoDateParts(todayLocalIso());
  const days = parts ? Array.from({ length: daysInMonth(parts.year, parts.month) }, (_value, index) => index + 1) : [];
  const monthTitle = parts ? formatIsoDateOnly(isoDateFromParts(parts.year, parts.month, 1), locale, { month: "long", year: "numeric" }) : "Choose Date";

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface"
          onPress={() => setSelectedDate(addMonthsToIsoDate(selectedDate, -1))}
        >
          <MaterialCommunityIcons name="chevron-left" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <Text className="font-sans text-base font-semibold text-text">{monthTitle}</Text>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface"
          onPress={() => setSelectedDate(addMonthsToIsoDate(selectedDate, 1))}
        >
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {parts
          ? days.map((day) => {
              const date = isoDateFromParts(parts.year, parts.month, day);
              const isSelected = date === selectedDate;

              return (
                <Pressable
                  key={date}
                  accessibilityLabel={`Choose ${formatDate(date, locale)}`}
                  accessibilityRole="button"
                  className={isSelected ? "h-10 w-10 items-center justify-center rounded-full bg-brand" : "h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-background"}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text className={isSelected ? "font-sans text-sm font-semibold text-text-inverse" : "font-sans text-sm font-semibold text-text"}>
                    {day}
                  </Text>
                </Pressable>
              );
            })
          : null}
      </View>
      <View className="flex-row gap-2">
        <PrimaryButton className="flex-1" onPress={onConfirm}>
          Select Date
        </PrimaryButton>
        <SecondaryButton className="flex-1" onPress={onCancel}>
          Cancel
        </SecondaryButton>
      </View>
    </View>
  );
}

function AmountInput({
  amount,
  currencyCode,
  error,
  locale,
  maxBalance,
  onBlur,
  onChange
}: {
  amount: string;
  currencyCode: string;
  error: string | null;
  locale: string;
  maxBalance: number | null;
  onBlur: () => void;
  onChange: (amount: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold uppercase text-text-muted">Transfer Amount</Text>
      <View className={error ? "flex-row items-center gap-2 rounded-lg border border-state-danger bg-surface px-4 py-3" : "flex-row items-center gap-2 rounded-lg border border-surface-border bg-surface px-4 py-3"}>
        <Text className="font-sans text-3xl font-bold leading-10 text-text">₹</Text>
        <TextInput
          className="h-14 flex-1 font-sans text-3xl font-bold leading-10 text-text"
          inputMode="decimal"
          onBlur={onBlur}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={theme.colors.text.muted}
          value={amount}
        />
      </View>
      {maxBalance !== null ? (
        <Text className="font-sans text-xs text-brand-soft">Current balance: {formatCurrency(maxBalance, currencyCode, locale)}</Text>
      ) : null}
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}

function NoteInput({ notes, onChange }: { notes: string; onChange: (notes: string) => void }) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-xs font-bold uppercase text-text-muted">Note (Optional)</Text>
      <View className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-2.5">
        <TextInput
          className="min-h-8 flex-1 font-sans text-sm text-text"
          multiline
          onChangeText={onChange}
          placeholder="Add a note"
          placeholderTextColor={theme.colors.text.muted}
          value={notes}
        />
        <MaterialCommunityIcons name="pencil-outline" size={theme.icons.sm} color={theme.colors.text.muted} />
      </View>
    </View>
  );
}

function HistoryRow({ currencyCode, locale, onDelete, onEdit, transfer }: { currencyCode: string; locale: string; onDelete: (transfer: TransferApi) => void; onEdit: (transfer: TransferApi) => void; transfer: TransferApi }) {
  return (
    <View className="flex-row items-center border-b border-surface-border py-2.5 last:border-b-0">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name="bank-transfer" size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <Pressable accessibilityRole="button" className="min-w-0 flex-1" onPress={() => onEdit(transfer)}>
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
          {transfer.fromAccountName}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          to {transfer.toAccountName}
        </Text>
      </Pressable>
      <View className="max-w-28 items-end pl-2">
        <Text className="font-sans text-sm font-semibold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {formatCurrency(transfer.amount, currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted">{formatDate(transfer.date, locale)}</Text>
      </View>
      <Pressable accessibilityLabel={`Delete transfer ${transfer.transferGroupId}`} accessibilityRole="button" className="ml-2" onPress={() => onDelete(transfer)}>
        <MaterialCommunityIcons name="delete-outline" size={theme.icons.sm} color={theme.colors.accent.rose} />
      </Pressable>
    </View>
  );
}

export function TransfersScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const vaultFilterKey = vaultId ?? "anonymous";
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [filtersByVault, setFiltersByVault] = useState<Record<string, TransferFilters>>({});
  const [draftFiltersByVault, setDraftFiltersByVault] = useState<Record<string, TransferFilters>>({});
  const filters = filtersByVault[vaultFilterKey] ?? {};
  const draftFilters = draftFiltersByVault[vaultFilterKey] ?? {};
  const setActiveFilters = (nextFilters: TransferFilters | ((current: TransferFilters) => TransferFilters)) => {
    setFiltersByVault((currentByVault) => {
      const currentFilters = currentByVault[vaultFilterKey] ?? {};
      const value = typeof nextFilters === "function" ? nextFilters(currentFilters) : nextFilters;

      return {
        ...currentByVault,
        [vaultFilterKey]: value
      };
    });
  };
  const setActiveDraftFilters = (nextFilters: TransferFilters | ((current: TransferFilters) => TransferFilters)) => {
    setDraftFiltersByVault((currentByVault) => {
      const currentFilters = currentByVault[vaultFilterKey] ?? {};
      const value = typeof nextFilters === "function" ? nextFilters(currentFilters) : nextFilters;

      return {
        ...currentByVault,
        [vaultFilterKey]: value
      };
    });
  };
  const transfersQuery = useTransfersQuery(token, vaultId, filters);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const createMutation = useCreateTransferMutation(token, vaultId);
  const updateMutation = useUpdateTransferMutation(token, vaultId);
  const deleteMutation = useDeleteTransferMutation(token, vaultId);
  const [draft, setDraft] = useState<TransferDraft>(() => createEmptyDraft());
  const [mode, setMode] = useState<FlowMode>("compose");
  const [historyMode, setHistoryMode] = useState<HistoryMode>("recent");
  const [pickerTarget, setPickerTarget] = useState<AccountPickerTarget>(null);
  const [filterAccountPickerVisible, setFilterAccountPickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>(null);
  const [datePickerValue, setDatePickerValue] = useState(todayLocalIso());
  const [filterVisible, setFilterVisible] = useState(false);
  const [attemptedReview, setAttemptedReview] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<TransferApi | null>(null);
  const [lastConfirmed, setLastConfirmed] = useState<TransferDraft | null>(null);
  const accounts = accountsQuery.data ?? [];
  const fromAccount = accounts.find((account) => account.id === draft.fromAccountId) ?? null;
  const toAccount = accounts.find((account) => account.id === draft.toAccountId) ?? null;
  const selectedFilterAccount = accounts.find((account) => account.id === draftFilters.accountId) ?? null;
  const formError = useMemo(() => transferFormError(draft), [draft]);
  const amountError = useMemo(() => transferAmountError(draft.amount), [draft.amount]);
  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error;
  const safeMutationError = mutationError ? toAppError(mutationError, "Transfer could not be saved.") : null;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasCachedRefreshError = Boolean(transfersQuery.error && transfersQuery.data);
  const maxBalance = accountBalance(fromAccount);
  const activeFilterCount = activeTransferFilterCount(filters);
  const filterError = transferFilterError(draftFilters);
  const visibleTransfers = visibleTransferHistory(transfersQuery.data ?? [], historyMode);
  const showReviewError = attemptedReview && formError;
  const visibleAmountError = (attemptedReview || amountTouched) && amountError ? amountError : null;

  const resetFlow = () => {
    setDraft(createEmptyDraft());
    setAttemptedReview(false);
    setAmountTouched(false);
    setMode("compose");
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (datePickerTarget) {
        setDatePickerTarget(null);
        return true;
      }

      if (filterAccountPickerVisible) {
        setFilterAccountPickerVisible(false);
        return true;
      }

      if (filterVisible) {
        setFilterVisible(false);
        return true;
      }

      if (historyMode === "all") {
        setHistoryMode("recent");
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [datePickerTarget, filterAccountPickerVisible, filterVisible, historyMode]);

  const openDatePicker = (target: Exclude<DatePickerTarget, null>, value: string | null | undefined) => {
    setDatePickerValue(value && value.trim() ? value : todayLocalIso());
    setDatePickerTarget(target);
  };

  const confirmDatePicker = () => {
    if (datePickerTarget === "transfer") {
      setDraft((current) => ({ ...current, date: datePickerValue }));
    }

    if (datePickerTarget === "filterFrom") {
      setActiveDraftFilters((current) => updateTransferFilter(current, "dateFrom", datePickerValue));
    }

    if (datePickerTarget === "filterTo") {
      setActiveDraftFilters((current) => updateTransferFilter(current, "dateTo", datePickerValue));
    }

    setDatePickerTarget(null);
  };

  const submit = () => {
    const error = transferFormError(draft);

    if (error) {
      return;
    }

    const payload = toTransferPayload(draft);

    if (draft.transferGroupId) {
      updateMutation.mutate(
        {
          body: payload,
          transferGroupId: draft.transferGroupId
        },
        {
          onSuccess: async () => {
            setLastConfirmed(draft);
            setMode("success");
          }
        }
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: async (transfer) => {
        setLastConfirmed({
          ...draft,
          transferGroupId: transfer.transferGroupId
        });
        setMode("success");
      }
    });
  };

  const editTransfer = (transfer: TransferApi) => {
    setDraft({
      ...transferFormFromTransfer(transfer),
      transferGroupId: transfer.transferGroupId
    });
    setAttemptedReview(false);
    setAmountTouched(false);
    setMode("compose");
  };

  if ((transfersQuery.isLoading || accountsQuery.isLoading) && !transfersQuery.data) {
    return (
      <Screen contentClassName="pb-44">
        <Text className="font-sans text-3xl font-bold text-text">Transfers</Text>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if ((transfersQuery.isError && !transfersQuery.data) || accountsQuery.isError) {
    return (
      <Screen contentClassName="pb-44">
        <Text className="font-sans text-3xl font-bold text-text">Transfers</Text>
        {transfersQuery.isError ? <ErrorView message="Transfers could not be loaded." onRetry={() => transfersQuery.refetch()} /> : null}
        {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} /> : null}
      </Screen>
    );
  }

  if (mode === "review") {
    return (
      <Screen contentClassName="gap-5 pb-44">
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityLabel="Back to transfer form" accessibilityRole="button" onPress={() => setMode("compose")}>
            <MaterialCommunityIcons name="chevron-left" size={theme.icons.lg} color={theme.colors.brand.soft} />
          </Pressable>
          <Text className="font-sans text-lg font-bold text-text">Review Transfer</Text>
          <View className="h-7 w-7" />
        </View>
        <View className="items-center gap-3">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-deep">
            <MaterialCommunityIcons name="check" size={56} color={theme.colors.text.DEFAULT} />
          </View>
          <Text className="font-sans text-2xl font-bold text-text">Review Details</Text>
          <Text className="font-sans text-sm text-text-muted">Please confirm the transfer</Text>
        </View>
        <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
          <AccountCard label="From" account={fromAccount} currencyCode={currencyCode} locale={locale} onPress={() => setMode("compose")} />
          <AccountCard label="To" account={toAccount} currencyCode={currencyCode} locale={locale} onPress={() => setMode("compose")} />
          <View className="gap-3 border-t border-surface-border pt-4">
            <ReviewRow label="Amount" value={formatCurrency(Number(draft.amount), currencyCode, locale)} />
            <ReviewRow label="Date" value={formatDate(draft.date, locale)} />
            <ReviewRow label="Note" value={draft.notes || "-"} />
          </View>
        </View>
        {safeMutationError ? <Text className="font-sans text-sm text-state-danger">{safeMutationError.message}</Text> : null}
        <View className="gap-3">
          <PrimaryButton loading={isSaving} onPress={submit}>
            {draft.transferGroupId ? "Save Changes" : "Confirm Transfer"}
          </PrimaryButton>
          <SecondaryButton disabled={isSaving} onPress={() => setMode("compose")}>
            Cancel
          </SecondaryButton>
        </View>
      </Screen>
    );
  }

  if (mode === "success" && lastConfirmed) {
    return (
      <Screen contentClassName="gap-5 pb-44">
        <View className="items-center gap-4 pt-8">
          <View className="h-32 w-32 items-center justify-center rounded-full bg-state-success">
            <MaterialCommunityIcons name="check" size={64} color={theme.colors.text.DEFAULT} />
          </View>
          <Text className="font-sans text-2xl font-bold text-text">Transfer Successful!</Text>
          <Text className="font-sans text-sm text-text-muted">
            {formatCurrency(Number(lastConfirmed.amount), currencyCode, locale)} has been transferred
          </Text>
        </View>
        <View className="rounded-lg border border-brand-muted bg-surface p-4">
          <Text className="font-sans text-sm font-semibold text-text">Balances are refreshed from the backend.</Text>
          <Text className="mt-1 font-sans text-xs text-text-muted">Money Vault records one Transfer Out and one Transfer In with the same group ID.</Text>
        </View>
        <PrimaryButton onPress={resetFlow}>Back to Transfers</PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen contentClassName="gap-5 pb-44" onRefresh={() => transfersQuery.refetch()} refreshing={transfersQuery.isRefetching}>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-3xl font-bold text-text">Transfers</Text>
        <Pressable
          accessibilityLabel="Filter transfers"
          accessibilityRole="button"
          className={activeFilterCount > 0 ? "h-10 w-10 items-center justify-center rounded-full bg-brand-deep" : "h-10 w-10 items-center justify-center rounded-full"}
          onPress={() => {
            setActiveDraftFilters(filters);
            setFilterVisible(true);
          }}
        >
          <MaterialCommunityIcons name="filter-variant" size={theme.icons.md} color={activeFilterCount > 0 ? theme.colors.text.DEFAULT : theme.colors.brand.soft} />
          {activeFilterCount > 0 ? (
            <View className="absolute right-1 top-1 h-4 min-w-4 items-center justify-center rounded-full bg-state-success px-1">
              <Text className="font-sans text-[10px] font-bold text-text">{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      {hasCachedRefreshError ? (
        <View className="rounded-lg border border-state-warning bg-surface p-3">
          <Text className="font-sans text-sm font-semibold text-state-warning">Could not refresh transfers. Showing previously loaded data.</Text>
        </View>
      ) : null}
      <View className="gap-4">
        <AccountCard label="From" account={fromAccount} currencyCode={currencyCode} locale={locale} onPress={() => setPickerTarget("from")} />
        <View className="items-center">
          <Pressable
            accessibilityLabel="Swap transfer accounts"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-brand"
            onPress={() =>
              setDraft((current) => ({
                ...current,
                fromAccountId: current.toAccountId,
                toAccountId: current.fromAccountId
              }))
            }
          >
            <MaterialCommunityIcons name="swap-vertical" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
          </Pressable>
        </View>
        <AccountCard label="To" account={toAccount} currencyCode={currencyCode} locale={locale} onPress={() => setPickerTarget("to")} />
        <AmountInput
          amount={draft.amount}
          currencyCode={currencyCode}
          error={visibleAmountError}
          locale={locale}
          maxBalance={maxBalance}
          onBlur={() => setAmountTouched(true)}
          onChange={(amount) => setDraft((current) => ({ ...current, amount }))}
        />
        <DateField label="Transfer Date" locale={locale} value={draft.date} onPress={() => openDatePicker("transfer", draft.date)} />
        {showReviewError && formError !== amountError ? (
          <Text className="font-sans text-sm text-state-danger">{formError}</Text>
        ) : null}
        <NoteInput notes={draft.notes} onChange={(notes) => setDraft((current) => ({ ...current, notes }))} />
        <PrimaryButton
          onPress={() => {
            setAttemptedReview(true);
            if (!formError) {
              setMode("review");
            }
          }}
        >
          {draft.transferGroupId ? "Review Changes" : "Review Transfer"}
        </PrimaryButton>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-xs font-bold uppercase text-text-muted">{historyMode === "all" ? "All Transfers" : "Transfer History"}</Text>
          {historyMode === "all" ? (
            <Pressable accessibilityLabel="Back to recent transfers" accessibilityRole="button" onPress={() => setHistoryMode("recent")}>
              <Text className="font-sans text-xs font-semibold text-brand-soft">Back</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityLabel="View all transfers" accessibilityRole="button" onPress={() => setHistoryMode("all")}>
              <Text className="font-sans text-xs font-semibold text-brand-soft">View All</Text>
            </Pressable>
          )}
        </View>
        {transfersQuery.data?.length === 0 ? (
          <EmptyState
            icon="bank-transfer"
            title={activeFilterCount > 0 ? "No matching transfers" : "No transfers"}
            message={activeFilterCount > 0 ? "Clear filters or try a different date/account." : "Account transfers will appear here."}
          />
        ) : (
          <View className="rounded-lg border border-surface-border bg-surface px-4">
            {visibleTransfers.map((transfer) => (
              <HistoryRow
                key={transfer.transferGroupId}
                transfer={transfer}
                currencyCode={currencyCode}
                locale={locale}
                onEdit={editTransfer}
                onDelete={setDeleteCandidate}
              />
            ))}
          </View>
        )}
      </View>

      <BottomSheet visible={pickerTarget !== null} title={pickerTarget === "from" ? "From Account" : "To Account"} onClose={() => setPickerTarget(null)}>
        <View className="gap-3">
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background p-3"
              onPress={() => {
                setDraft((current) => ({
                  ...current,
                  fromAccountId: pickerTarget === "from" ? account.id : current.fromAccountId,
                  toAccountId: pickerTarget === "to" ? account.id : current.toAccountId
                }));
                setPickerTarget(null);
              }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
                <MaterialCommunityIcons name={accountIcon(account)} size={theme.icons.sm} color={accountTone(account)} />
              </View>
              <View className="flex-1">
                <Text className="font-sans text-sm font-semibold text-text">{account.name}</Text>
                <Text className="font-sans text-xs text-text-muted">{account.type}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={filterAccountPickerVisible} title="Filter Account" onClose={() => setFilterAccountPickerVisible(false)}>
        <View className="gap-3">
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background p-3"
            onPress={() => {
              setActiveDraftFilters((current) => clearTransferFilter(current, "accountId"));
              setFilterAccountPickerVisible(false);
            }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
              <MaterialCommunityIcons name="bank-transfer" size={theme.icons.sm} color={theme.colors.brand.soft} />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-sm font-semibold text-text">All accounts</Text>
              <Text className="font-sans text-xs text-text-muted">Source or destination</Text>
            </View>
          </Pressable>
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background p-3"
              onPress={() => {
                setActiveDraftFilters((current) => updateTransferFilter(current, "accountId", account.id));
                setFilterAccountPickerVisible(false);
              }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
                <MaterialCommunityIcons name={accountIcon(account)} size={theme.icons.sm} color={accountTone(account)} />
              </View>
              <View className="flex-1">
                <Text className="font-sans text-sm font-semibold text-text">{account.name}</Text>
                <Text className="font-sans text-xs text-text-muted">{account.type}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={datePickerTarget !== null}
        title={datePickerTarget === "transfer" ? "Transfer Date" : datePickerTarget === "filterFrom" ? "From Date" : "To Date"}
        onClose={() => setDatePickerTarget(null)}
      >
        <MonthDatePicker
          locale={locale}
          selectedDate={datePickerValue}
          setSelectedDate={setDatePickerValue}
          onCancel={() => setDatePickerTarget(null)}
          onConfirm={confirmDatePicker}
        />
      </BottomSheet>

      <BottomSheet visible={filterVisible} title="Filter Transfers" onClose={() => setFilterVisible(false)}>
        <View className="gap-4">
          <FilterAccountField
            account={selectedFilterAccount}
            onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "accountId"))}
            onPress={() => setFilterAccountPickerVisible(true)}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateField
                label="From Date"
                locale={locale}
                value={draftFilters.dateFrom}
                onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "dateFrom"))}
                onPress={() => openDatePicker("filterFrom", draftFilters.dateFrom)}
              />
            </View>
            <View className="flex-1">
              <DateField
                label="To Date"
                locale={locale}
                value={draftFilters.dateTo}
                onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "dateTo"))}
                onPress={() => openDatePicker("filterTo", draftFilters.dateTo)}
              />
            </View>
          </View>
          {filterError ? <Text className="font-sans text-sm text-state-danger">{filterError}</Text> : null}
          <View className="flex-row gap-2">
            <PrimaryButton
              className="flex-1"
              disabled={Boolean(filterError)}
              onPress={() => {
                setActiveFilters(draftFilters);
                setFilterVisible(false);
                setHistoryMode("all");
              }}
            >
              Apply
            </PrimaryButton>
            <SecondaryButton
              className="flex-1"
              onPress={() => {
                setActiveDraftFilters(clearTransferFilters());
                setActiveFilters(clearTransferFilters());
                setFilterVisible(false);
              }}
            >
              Clear
            </SecondaryButton>
          </View>
          <SecondaryButton onPress={() => setFilterVisible(false)}>Cancel</SecondaryButton>
        </View>
      </BottomSheet>

      <BottomSheet visible={Boolean(deleteCandidate)} title="Delete transfer?" onClose={() => setDeleteCandidate(null)}>
        <View className="gap-4">
          <Text className="font-sans text-sm text-text-muted">
            This will remove the transfer from both accounts and update both account balances. This action cannot be undone.
          </Text>
          {safeMutationError ? <Text className="font-sans text-sm text-state-danger">{safeMutationError.message}</Text> : null}
          <View className="flex-row gap-2">
            <PrimaryButton
              className="flex-1"
              loading={deleteMutation.isPending}
              onPress={() => {
                if (!deleteCandidate) {
                  return;
                }

                deleteMutation.mutate(deleteCandidate.transferGroupId, {
                  onSuccess: async () => {
                    setDeleteCandidate(null);
                  }
                });
              }}
            >
              Delete
            </PrimaryButton>
            <SecondaryButton className="flex-1" disabled={deleteMutation.isPending} onPress={() => setDeleteCandidate(null)}>
              Cancel
            </SecondaryButton>
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      <Text className="flex-1 text-right font-sans text-sm font-semibold text-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
