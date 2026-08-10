import { Pressable, Text, TextInput, View } from "react-native";

import { BottomSheet, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { formatDashboardMoney } from "@/features/dashboard/dashboardLayout";
import { settlementItemLabel } from "@/features/dashboard/settlement";
import type { SharedSettlementAccountApi, SharedSettlementItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

function SettlementChoice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={active ? "rounded-lg border border-brand bg-brand-deep p-3" : "rounded-lg border border-surface-border bg-surface p-3"}
      onPress={onPress}
    >
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
    </Pressable>
  );
}

function AccountChoice({
  account,
  active,
  currencyCode,
  locale,
  onPress
}: {
  account: SharedSettlementAccountApi;
  active: boolean;
  currencyCode: CurrencyCode;
  locale: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={active ? "rounded-lg border border-brand bg-brand-deep p-3" : "rounded-lg border border-surface-border bg-surface p-3"}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
            {account.name}
          </Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
            {account.type}
          </Text>
        </View>
        {typeof account.balance === "number" ? (
          <Text className="font-sans text-sm font-semibold text-text tabular-nums">
            {formatDashboardMoney(account.balance, currencyCode, locale)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export interface SettlementSheetProps {
  amount: string;
  currencyCode: CurrencyCode;
  date: string;
  error: string | null;
  fromAccountId: number | null;
  isLoading: boolean;
  isSaving: boolean;
  items: SharedSettlementItemApi[];
  locale: string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onDateChange: (value: string) => void;
  onFromAccountChange: (value: number) => void;
  onItemChange: (item: SharedSettlementItemApi) => void;
  onSubmit: () => void;
  onToAccountChange: (value: number) => void;
  selectedItem: SharedSettlementItemApi | null;
  toAccountId: number | null;
  visible: boolean;
}

export function SettlementSheet({
  amount,
  currencyCode,
  date,
  error,
  fromAccountId,
  isLoading,
  isSaving,
  items,
  locale,
  onAmountChange,
  onClose,
  onDateChange,
  onFromAccountChange,
  onItemChange,
  onSubmit,
  onToAccountChange,
  selectedItem,
  toAccountId,
  visible
}: SettlementSheetProps) {
  return (
    <BottomSheet visible={visible} title="Mark Settled" onClose={onClose}>
      <View className="gap-4">
        {isLoading ? (
          <LoadingSkeleton variant="card" />
        ) : selectedItem ? (
          <>
            {items.length > 1 ? (
              <View className="gap-2">
                <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Settlement</Text>
                {items.map((item, index) => (
                  <SettlementChoice
                    key={`${item.shared_vault_id}:${item.from_vault_id}:${item.to_vault_id}:${index}`}
                    active={item === selectedItem}
                    label={settlementItemLabel(item, formatDashboardMoney(item.amount, currencyCode, locale))}
                    onPress={() => onItemChange(item)}
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-lg border border-surface-border bg-surface p-3">
                <Text className="font-sans text-sm font-semibold text-text">
                  {settlementItemLabel(selectedItem, formatDashboardMoney(selectedItem.amount, currencyCode, locale))}
                </Text>
              </View>
            )}

            <View className="gap-2">
              <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Paying Account</Text>
              {selectedItem.from_accounts.map((account) => (
                <AccountChoice
                  key={account.id}
                  account={account}
                  active={account.id === fromAccountId}
                  currencyCode={currencyCode}
                  locale={locale}
                  onPress={() => onFromAccountChange(account.id)}
                />
              ))}
            </View>

            <View className="gap-2">
              <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Receiving Account</Text>
              {selectedItem.to_accounts.map((account) => (
                <AccountChoice
                  key={account.id}
                  account={account}
                  active={account.id === toAccountId}
                  currencyCode={currencyCode}
                  locale={locale}
                  onPress={() => onToAccountChange(account.id)}
                />
              ))}
            </View>

            <View className="gap-2">
              <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Amount</Text>
              <TextInput
                className="h-12 rounded-lg border border-surface-border bg-background px-3 font-sans text-base text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={onAmountChange}
              />
            </View>

            <View className="gap-2">
              <Text className="font-sans text-xs font-semibold uppercase text-text-muted">Date</Text>
              <TextInput
                className="h-12 rounded-lg border border-surface-border bg-background px-3 font-sans text-base text-text"
                inputMode="text"
                value={date}
                onChangeText={onDateChange}
              />
            </View>
          </>
        ) : (
          <Text className="font-sans text-sm text-text-muted">No outstanding settlement to mark.</Text>
        )}

        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}

        <View className="flex-row gap-3">
          <SecondaryButton className="flex-1" disabled={isSaving} onPress={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton className="flex-1" loading={isSaving} disabled={!selectedItem || isSaving} icon="check-circle-outline" onPress={onSubmit}>
            Mark Settled
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}
