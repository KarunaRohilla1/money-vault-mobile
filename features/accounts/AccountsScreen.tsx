import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { TextInput } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { FormField } from "@/components/forms/FormField";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useSetPrimaryAccountMutation,
  useUpdateAccountMutation
} from "@/features/accounts/api";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";
import type { AccountApi } from "@/services/api/types";

const ACCOUNT_TYPES = ["Bank", "Cash", "Credit Card"] as const;

interface AccountFormState {
  id: number | null;
  isPrimary: boolean;
  name: string;
  openingBalance: string;
  type: string;
}

const EMPTY_FORM: AccountFormState = {
  id: null,
  isPrimary: false,
  name: "",
  openingBalance: "",
  type: ACCOUNT_TYPES[0]
};

export function AccountsScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const createMutation = useCreateAccountMutation(token, vaultId);
  const updateMutation = useUpdateAccountMutation(token, vaultId);
  const deleteMutation = useDeleteAccountMutation(token, vaultId);
  const setPrimaryMutation = useSetPrimaryAccountMutation(token, vaultId);
  const [form, setForm] = useState<AccountFormState>(EMPTY_FORM);
  const formError = useMemo(() => {
    if (!form.name.trim()) {
      return "Account name is required.";
    }

    const amount = Number(form.openingBalance || 0);
    if (!Number.isFinite(amount)) {
      return "Opening balance must be a number.";
    }

    return null;
  }, [form.name, form.openingBalance]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const submit = () => {
    if (formError) {
      return;
    }

    const body = {
      isPrimary: form.isPrimary,
      name: form.name.trim(),
      openingBalance: Number(form.openingBalance || 0),
      type: form.type
    };

    if (form.id) {
      updateMutation.mutate(
        {
          accountId: form.id,
          body
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

  const editAccount = (account: AccountApi) => {
    setForm({
      id: account.id,
      isPrimary: account.isPrimary,
      name: account.name,
      openingBalance: String(account.openingBalance),
      type: account.type
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Accounts" description="Balances are derived from opening balances and posted transactions." />

      {accountsQuery.isLoading ? (
        <View className="gap-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </View>
      ) : null}

      {accountsQuery.isError ? (
        <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} />
      ) : null}

      <Section title={form.id ? "Edit account" : "Add account"}>
        <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
          <FormField label="Name" error={formError && !form.name.trim() ? formError : undefined}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="Account name"
              placeholderTextColor={theme.colors.text.muted}
              value={form.name}
            />
          </FormField>
          <FormField label="Opening balance" error={formError?.includes("balance") ? formError : undefined}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              inputMode="decimal"
              onChangeText={(openingBalance) => setForm((current) => ({ ...current, openingBalance }))}
              placeholder="0"
              placeholderTextColor={theme.colors.text.muted}
              value={form.openingBalance}
            />
          </FormField>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map((type) => (
              <SecondaryButton
                key={type}
                className={form.type === type ? "border-brand-soft" : undefined}
                onPress={() => setForm((current) => ({ ...current, type }))}
              >
                {type}
              </SecondaryButton>
            ))}
          </View>
          <View className="flex-row gap-2">
            <PrimaryButton disabled={Boolean(formError) || isSaving} onPress={submit}>
              {form.id ? "Save account" : "Add account"}
            </PrimaryButton>
            {form.id ? <SecondaryButton onPress={() => setForm(EMPTY_FORM)}>Cancel</SecondaryButton> : null}
          </View>
        </View>
      </Section>

      {accountsQuery.data?.length === 0 ? (
        <EmptyState icon="wallet-outline" title="No accounts yet" message="Add a bank, cash, or credit card account to begin tracking balances." />
      ) : null}

      {accountsQuery.data && accountsQuery.data.length > 0 ? (
        <Section title="All accounts">
          <View className="gap-3">
            {accountsQuery.data.map((account) => (
              <View key={account.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-lg bg-brand-deep">
                      <MaterialCommunityIcons name={account.type === "Credit Card" ? "credit-card-outline" : "wallet-outline"} size={22} color={theme.colors.brand.soft} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-base font-semibold text-text">{account.name}</Text>
                      <Text className="font-sans text-xs text-text-muted">
                        {account.type}
                        {account.isPrimary ? " · Primary" : ""}
                      </Text>
                    </View>
                  </View>
                  <CurrencyText
                    value={account.balance ?? account.openingBalance}
                    currencyCode={currencyCode}
                    locale={locale}
                    className="text-right text-lg font-semibold"
                  />
                </View>
                {!account.isPrimary ? (
                  <SecondaryButton disabled={setPrimaryMutation.isPending} onPress={() => setPrimaryMutation.mutate(account.id)}>
                    Make primary
                  </SecondaryButton>
                ) : null}
                <View className="flex-row gap-2">
                  <SecondaryButton onPress={() => editAccount(account)}>Edit</SecondaryButton>
                  <SecondaryButton disabled={deleteMutation.isPending} onPress={() => deleteMutation.mutate(account.id)}>
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
