import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, Share, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { BottomSheet, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import { useDeleteTransferMutation, useTransfersQuery } from "@/features/transfers/api";
import { DateField, FilterAccountField, HistoryRow, MonthDatePicker } from "@/features/transfers/TransfersScreen";
import {
  activeTransferFilterCount,
  clearTransferFilter,
  clearTransferFilters,
  transferFilterError,
  transfersToCsv,
  updateTransferFilter,
  type TransferFilters
} from "@/features/transfers/transferModel";
import { formatIsoDateOnly, todayLocalIso } from "@/lib/date";
import { toAppError } from "@/lib/errors";
import type { AccountApi, TransferApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

type AccountFilterTarget = "source" | "destination" | null;
type HistoryDateTarget = "from" | "to" | null;

const EMPTY_FILTERS: TransferFilters = {};
const EMPTY_ACCOUNTS: AccountApi[] = [];

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

function filterChipText(filters: TransferFilters, accounts: AccountApi[], locale: string) {
  const source = accounts.find((account) => account.id === filters.sourceAccountId)?.name;
  const destination = accounts.find((account) => account.id === filters.destinationAccountId)?.name;
  const chips: string[] = [];

  if (source) {
    chips.push(`Source: ${source}`);
  }

  if (destination) {
    chips.push(`Destination: ${destination}`);
  }

  if (filters.dateFrom) {
    chips.push(`From ${formatIsoDateOnly(filters.dateFrom, locale)}`);
  }

  if (filters.dateTo) {
    chips.push(`To ${formatIsoDateOnly(filters.dateTo, locale)}`);
  }

  return chips;
}

export function TransferHistoryScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [filtersByVault, setFiltersByVault] = useState<Record<string, TransferFilters>>({});
  const [draftFiltersByVault, setDraftFiltersByVault] = useState<Record<string, TransferFilters>>({});
  const vaultFilterKey = vaultId ?? "anonymous";
  const filters = filtersByVault[vaultFilterKey] ?? EMPTY_FILTERS;
  const draftFilters = draftFiltersByVault[vaultFilterKey] ?? EMPTY_FILTERS;
  const transfersQuery = useTransfersQuery(token, vaultId, filters);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const deleteMutation = useDeleteTransferMutation(token, vaultId);
  const [filterVisible, setFilterVisible] = useState(false);
  const [accountTarget, setAccountTarget] = useState<AccountFilterTarget>(null);
  const [dateTarget, setDateTarget] = useState<HistoryDateTarget>(null);
  const [datePickerValue, setDatePickerValue] = useState(todayLocalIso());
  const [deleteCandidate, setDeleteCandidate] = useState<TransferApi | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const accounts = accountsQuery.data ?? EMPTY_ACCOUNTS;
  const transfers = transfersQuery.data ?? [];
  const filterError = transferFilterError(draftFilters);
  const activeFilterCount = activeTransferFilterCount(filters);
  const chips = useMemo(() => filterChipText(filters, accounts, locale), [accounts, filters, locale]);
  const sourceAccount = accounts.find((account) => account.id === draftFilters.sourceAccountId) ?? null;
  const destinationAccount = accounts.find((account) => account.id === draftFilters.destinationAccountId) ?? null;
  const mutationError = deleteMutation.error;
  const safeMutationError = mutationError ? toAppError(mutationError, "Transfer could not be deleted.") : null;
  const hasCachedRefreshError = Boolean(transfersQuery.error && transfersQuery.data);

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

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dateTarget) {
        setDateTarget(null);
        return true;
      }

      if (accountTarget) {
        setAccountTarget(null);
        return true;
      }

      if (filterVisible) {
        setFilterVisible(false);
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [accountTarget, dateTarget, filterVisible]);

  const openDatePicker = (target: Exclude<HistoryDateTarget, null>, value: string | null | undefined) => {
    setDatePickerValue(value && value.trim() ? value : todayLocalIso());
    setDateTarget(target);
  };

  const confirmDatePicker = () => {
    if (dateTarget === "from") {
      setActiveDraftFilters((current) => updateTransferFilter(current, "dateFrom", datePickerValue));
    }

    if (dateTarget === "to") {
      setActiveDraftFilters((current) => updateTransferFilter(current, "dateTo", datePickerValue));
    }

    setDateTarget(null);
  };

  const exportCsv = async () => {
    if (transfers.length === 0) {
      setExportMessage("No transfers to export.");
      return;
    }

    const filename = `money-vault-transfers-${todayLocalIso()}.csv`;
    const csv = transfersToCsv(transfers);

    await Share.share({
      message: `${filename}\n\n${csv}`,
      title: filename
    });
  };

  if ((transfersQuery.isLoading || accountsQuery.isLoading) && !transfersQuery.data) {
    return (
      <Screen contentClassName="gap-4">
        <Text className="font-sans text-3xl font-bold text-text">Transfer History</Text>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if ((transfersQuery.isError && !transfersQuery.data) || accountsQuery.isError) {
    return (
      <Screen contentClassName="gap-4">
        <Text className="font-sans text-3xl font-bold text-text">Transfer History</Text>
        {transfersQuery.isError ? <ErrorView message="Transfers could not be loaded." onRetry={() => transfersQuery.refetch()} /> : null}
        {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} /> : null}
      </Screen>
    );
  }

  return (
    <Screen contentClassName="gap-4" onRefresh={() => transfersQuery.refetch()} refreshing={transfersQuery.isRefetching}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityLabel="Back to Transfers" accessibilityRole="button" onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={theme.icons.lg} color={theme.colors.brand.soft} />
          </Pressable>
          <Text className="font-sans text-3xl font-bold text-text">History</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityLabel="Filter transfer history"
            accessibilityRole="button"
            className={activeFilterCount > 0 ? "h-10 w-10 items-center justify-center rounded-full bg-brand-deep" : "h-10 w-10 items-center justify-center rounded-full border border-surface-border"}
            onPress={() => {
              setActiveDraftFilters(filters);
              setFilterVisible(true);
            }}
          >
            <MaterialCommunityIcons name="filter-variant" size={theme.icons.md} color={activeFilterCount > 0 ? theme.colors.text.DEFAULT : theme.colors.brand.soft} />
          </Pressable>
          <Pressable
            accessibilityLabel="Export transfer history"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full border border-surface-border"
            disabled={transfers.length === 0}
            onPress={() => {
              void exportCsv();
            }}
          >
            <MaterialCommunityIcons name="download-outline" size={theme.icons.md} color={transfers.length === 0 ? theme.colors.text.muted : theme.colors.brand.soft} />
          </Pressable>
        </View>
      </View>

      {hasCachedRefreshError ? (
        <View className="rounded-lg border border-state-warning bg-surface p-3">
          <Text className="font-sans text-sm font-semibold text-state-warning">Could not refresh transfers. Showing previously loaded data.</Text>
        </View>
      ) : null}

      {chips.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {chips.map((chip) => (
            <View key={chip} className="rounded-full border border-brand-muted bg-brand-deep px-3 py-1">
              <Text className="font-sans text-xs font-semibold text-brand-soft">{chip}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={() => setActiveFilters(clearTransferFilters())}>
            <Text className="font-sans text-xs font-semibold text-state-danger">Clear filters</Text>
          </Pressable>
        </View>
      ) : null}

      {exportMessage ? <Text className="font-sans text-sm text-state-warning">{exportMessage}</Text> : null}

      {transfers.length === 0 ? (
        <EmptyState
          icon="bank-transfer"
          title={activeFilterCount > 0 ? "No matching transfers" : "No transfers"}
          message={activeFilterCount > 0 ? "Clear filters or try a different date/account." : "Account transfers will appear here."}
        />
      ) : (
        <View className="rounded-lg border border-surface-border bg-surface px-4">
          {transfers.map((transfer) => (
            <HistoryRow
              key={transfer.transferGroupId}
              transfer={transfer}
              currencyCode={currencyCode}
              locale={locale}
              onEdit={() => router.back()}
              onDelete={setDeleteCandidate}
            />
          ))}
        </View>
      )}

      <BottomSheet visible={filterVisible} title="Filter Transfers" onClose={() => setFilterVisible(false)}>
        <View className="gap-4">
          <FilterAccountField
            label="Source Account"
            account={sourceAccount}
            onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "sourceAccountId"))}
            onPress={() => setAccountTarget("source")}
          />
          <FilterAccountField
            label="Destination Account"
            account={destinationAccount}
            onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "destinationAccountId"))}
            onPress={() => setAccountTarget("destination")}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateField
                label="From Date"
                locale={locale}
                value={draftFilters.dateFrom}
                onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "dateFrom"))}
                onPress={() => openDatePicker("from", draftFilters.dateFrom)}
              />
            </View>
            <View className="flex-1">
              <DateField
                label="To Date"
                locale={locale}
                value={draftFilters.dateTo}
                onClear={() => setActiveDraftFilters((current) => clearTransferFilter(current, "dateTo"))}
                onPress={() => openDatePicker("to", draftFilters.dateTo)}
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
              Clear all
            </SecondaryButton>
          </View>
          <SecondaryButton onPress={() => setFilterVisible(false)}>Cancel</SecondaryButton>
        </View>
      </BottomSheet>

      <BottomSheet visible={accountTarget !== null} title={accountTarget === "source" ? "Source Account" : "Destination Account"} onClose={() => setAccountTarget(null)}>
        <View className="gap-3">
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background p-3"
              onPress={() => {
                setActiveDraftFilters((current) =>
                  updateTransferFilter(current, accountTarget === "source" ? "sourceAccountId" : "destinationAccountId", account.id)
                );
                setAccountTarget(null);
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

      <BottomSheet visible={dateTarget !== null} title={dateTarget === "from" ? "From Date" : "To Date"} onClose={() => setDateTarget(null)}>
        <MonthDatePicker
          locale={locale}
          selectedDate={datePickerValue}
          setSelectedDate={setDatePickerValue}
          onCancel={() => setDateTarget(null)}
          onConfirm={confirmDatePicker}
        />
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
