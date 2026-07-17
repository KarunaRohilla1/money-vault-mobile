import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import {
  useCreateTransferMutation,
  useDeleteTransferMutation,
  useTransfersQuery,
  useUpdateTransferMutation
} from "@/features/transfers/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";
import type { TransferApi } from "@/services/api/types";

interface TransferFormState {
  amount: string;
  date: string;
  fromAccountId: number | null;
  notes: string;
  toAccountId: number | null;
  transferGroupId: string | null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM: TransferFormState = {
  amount: "",
  date: todayIso(),
  fromAccountId: null,
  notes: "",
  toAccountId: null,
  transferGroupId: null
};

export function TransfersScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const transfersQuery = useTransfersQuery(token, vaultId);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const createMutation = useCreateTransferMutation(token, vaultId);
  const updateMutation = useUpdateTransferMutation(token, vaultId);
  const deleteMutation = useDeleteTransferMutation(token, vaultId);
  const [form, setForm] = useState<TransferFormState>(EMPTY_FORM);
  const formError = useMemo(() => {
    const amount = Number(form.amount);
    if (!form.fromAccountId || !form.toAccountId) {
      return "Choose both accounts.";
    }

    if (form.fromAccountId === form.toAccountId) {
      return "Choose different accounts.";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (!form.date.trim()) {
      return "Date is required.";
    }

    return null;
  }, [form.amount, form.date, form.fromAccountId, form.toAccountId]);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submit = () => {
    if (formError || !form.fromAccountId || !form.toAccountId) {
      return;
    }

    const body = {
      amount: Number(form.amount),
      date: form.date,
      fromAccountId: form.fromAccountId,
      notes: form.notes,
      toAccountId: form.toAccountId
    };

    if (form.transferGroupId) {
      updateMutation.mutate(
        {
          body,
          transferGroupId: form.transferGroupId
        },
        {
          onSuccess: () => setForm(EMPTY_FORM)
        }
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: () => setForm(EMPTY_FORM)
    });
  };

  const editTransfer = (transfer: TransferApi) => {
    setForm({
      amount: String(transfer.amount),
      date: transfer.date,
      fromAccountId: transfer.fromAccountId,
      notes: transfer.notes ?? "",
      toAccountId: transfer.toAccountId,
      transferGroupId: transfer.transferGroupId
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Transfers" description="Transfers are modeled as paired legacy transfer transactions." />
      {transfersQuery.isLoading || accountsQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {transfersQuery.isError ? <ErrorView message="Transfers could not be loaded." onRetry={() => transfersQuery.refetch()} /> : null}
      {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} /> : null}

      <Section title={form.transferGroupId ? "Edit transfer" : "Add transfer"}>
        <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
          <FormField label="From account" error={formError?.includes("accounts") ? formError : undefined}>
            <AccountPicker
              selectedId={form.fromAccountId}
              accounts={accountsQuery.data ?? []}
              onSelect={(fromAccountId) => setForm((current) => ({ ...current, fromAccountId }))}
            />
          </FormField>
          <FormField label="To account">
            <AccountPicker
              selectedId={form.toAccountId}
              accounts={accountsQuery.data ?? []}
              onSelect={(toAccountId) => setForm((current) => ({ ...current, toAccountId }))}
            />
          </FormField>
          <FormField label="Amount" error={formError?.includes("Amount") ? formError : undefined}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              inputMode="decimal"
              onChangeText={(amount) => setForm((current) => ({ ...current, amount }))}
              placeholder="0"
              placeholderTextColor={theme.colors.text.muted}
              value={form.amount}
            />
          </FormField>
          <FormField label="Date" error={formError?.includes("Date") ? formError : undefined}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              onChangeText={(date) => setForm((current) => ({ ...current, date }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.text.muted}
              value={form.date}
            />
          </FormField>
          <FormField label="Notes">
            <TextInput
              className="min-h-12 rounded-md border border-surface-border bg-background px-4 py-3 font-sans text-base text-text"
              multiline
              onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
              placeholder="Optional"
              placeholderTextColor={theme.colors.text.muted}
              value={form.notes}
            />
          </FormField>
          <View className="flex-row gap-2">
            <PrimaryButton disabled={Boolean(formError) || isSaving} onPress={submit}>
              {form.transferGroupId ? "Save transfer" : "Add transfer"}
            </PrimaryButton>
            {form.transferGroupId ? <SecondaryButton onPress={() => setForm(EMPTY_FORM)}>Cancel</SecondaryButton> : null}
          </View>
        </View>
      </Section>

      {transfersQuery.data?.length === 0 ? <EmptyState icon="bank-transfer" title="No transfers" message="Account transfers will appear here." /> : null}
      {transfersQuery.data && transfersQuery.data.length > 0 ? (
        <Section title="Transfer history">
          <View className="gap-3">
            {transfersQuery.data.map((transfer) => (
              <View key={transfer.transferGroupId} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
                    <MaterialCommunityIcons name="bank-transfer" size={22} color={theme.colors.brand.soft} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-sm font-semibold text-text">
                      {transfer.fromAccountName} to {transfer.toAccountName}
                    </Text>
                    <Text className="font-sans text-xs text-text-muted">{transfer.date}</Text>
                  </View>
                  <CurrencyText value={transfer.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                </View>
                {transfer.notes ? <Text className="font-sans text-xs text-text-muted">{transfer.notes}</Text> : null}
                <View className="flex-row gap-2">
                  <SecondaryButton onPress={() => editTransfer(transfer)}>Edit</SecondaryButton>
                  <SecondaryButton disabled={deleteMutation.isPending} onPress={() => deleteMutation.mutate(transfer.transferGroupId)}>
                    Delete
                  </SecondaryButton>
                </View>
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

interface AccountPickerProps {
  accounts: { id: number; name: string }[];
  onSelect: (accountId: number) => void;
  selectedId: number | null;
}

function AccountPicker({ accounts, onSelect, selectedId }: AccountPickerProps) {
  if (accounts.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">Add at least two accounts before creating transfers.</Text>;
  }

  return (
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
  );
}
