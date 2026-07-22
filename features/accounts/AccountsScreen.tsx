import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { PanResponder, Pressable, Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { BottomSheet, CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { AccountTypeSelector } from "@/features/accounts/AccountTypeSelector";
import {
  accountBalance,
  accountBalanceLabel,
  accountSummary,
  visibleAccountFormErrors,
  type AccountFormTouched,
  type AccountFormValues
} from "@/features/accounts/accountModel";
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useSetPrimaryAccountMutation,
  useUpdateAccountMutation
} from "@/features/accounts/api";
import { toAppError } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import type { AccountType } from "@/services/api/accountTypes";
import type { AccountApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

interface AccountFormState extends AccountFormValues {
  id: number | null;
  isPrimary: boolean;
}

const EMPTY_FORM: AccountFormState = {
  id: null,
  isPrimary: false,
  name: "",
  openingBalance: "",
  type: ""
};

function accountIcon(accountType: string) {
  if (accountType === "Credit Card") {
    return "credit-card-outline";
  }

  if (accountType === "Cash") {
    return "cash";
  }

  return "wallet-outline";
}

function accountGroupFor(account: AccountApi) {
  if (account.type === "Credit Card") {
    return "Credit Cards";
  }

  if (account.type === "Other") {
    return "Other Accounts";
  }

  return "Cash & Bank";
}

function groupTone(group: string) {
  if (group === "Credit Cards") {
    return {
      color: theme.colors.accent.rose,
      icon: "credit-card-outline" as const,
      label: "Cards"
    };
  }

  if (group === "Other Accounts") {
    return {
      color: theme.colors.brand.soft,
      icon: "chart-line" as const,
      label: "Accounts"
    };
  }

  return {
    color: theme.colors.accent.emerald,
    icon: "bank-outline" as const,
    label: "Accounts"
  };
}

function AccountRow({
  account,
  currencyCode,
  locale,
  onArchive,
  onEdit,
  onSetPrimary,
  settingPrimary
}: {
  account: AccountApi;
  currencyCode: string;
  locale: string;
  onArchive: (account: AccountApi) => void;
  onEdit: (account: AccountApi) => void;
  onSetPrimary: (accountId: number) => void;
  settingPrimary: boolean;
}) {
  const balance = accountBalance(account);
  const isCreditCard = account.type === "Credit Card";

  return (
    <Pressable accessibilityRole="button" className="flex-row items-center gap-3 py-3.5" onPress={() => onEdit(account)}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
          <MaterialCommunityIcons name={accountIcon(account.type)} size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans text-base font-semibold text-text">{account.name}</Text>
            {account.isPrimary ? (
            <View className="rounded-md bg-brand-muted px-2 py-0.5">
              <Text className="font-sans text-xs font-semibold text-state-success">Primary</Text>
              </View>
            ) : null}
        </View>
        <Text className="mt-1 font-sans text-sm text-text-muted">{account.type}</Text>
      </View>
      <View className="w-32 items-end">
        {balance === null ? (
          <Text className="text-right font-sans text-sm font-semibold text-state-warning">Unavailable</Text>
        ) : (
          <CurrencyText
            className={isCreditCard ? "text-right text-lg font-semibold text-accent-rose" : "text-right text-lg font-semibold"}
            currencyCode={currencyCode}
            locale={locale}
            value={isCreditCard ? Math.abs(balance) : balance}
          />
        )}
        <Text className="mt-1 font-sans text-xs text-text-muted">{accountBalanceLabel(account)}</Text>
        <View className="mt-2 flex-row gap-2">
          {!account.isPrimary ? (
            <Pressable accessibilityLabel={`Make ${account.name} primary`} disabled={settingPrimary} onPress={() => onSetPrimary(account.id)}>
              <MaterialCommunityIcons name="star-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel={`Archive ${account.name}`} onPress={() => onArchive(account)}>
            <MaterialCommunityIcons name="archive-outline" size={theme.icons.sm} color={theme.colors.text.muted} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function AccountSection({
  accounts,
  currencyCode,
  group,
  locale,
  onArchive,
  onEdit,
  onSetPrimary,
  settingPrimary
}: {
  accounts: AccountApi[];
  currencyCode: string;
  group: string;
  locale: string;
  onArchive: (account: AccountApi) => void;
  onEdit: (account: AccountApi) => void;
  onSetPrimary: (accountId: number) => void;
  settingPrimary: boolean;
}) {
  const tone = groupTone(group);

  if (accounts.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
            <MaterialCommunityIcons name={tone.icon} size={theme.icons.sm} color={tone.color} />
          </View>
          <Text className="font-sans text-xl font-bold text-text">{group}</Text>
        </View>
        <Text className="font-sans text-sm font-semibold" style={{ color: tone.color }}>
          {accounts.length} {tone.label}
        </Text>
      </View>
      <View className="divide-y divide-surface-border rounded-lg border border-surface-border bg-surface px-4">
        {accounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            currencyCode={currencyCode}
            locale={locale}
            onArchive={onArchive}
            onEdit={onEdit}
            onSetPrimary={onSetPrimary}
            settingPrimary={settingPrimary}
          />
        ))}
      </View>
    </View>
  );
}

function SummaryCard({ accounts, currencyCode, locale }: { accounts: AccountApi[]; currencyCode: string; locale: string }) {
  const summary = accountSummary(accounts);

  return (
    <View className="gap-4 rounded-lg border border-brand-muted bg-surface-raised p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-xs font-semibold uppercase text-brand-soft">Net Worth</Text>
          <Text className="mt-2 font-sans text-4xl font-bold text-text" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {formatCurrency(summary.netWorth, currencyCode, locale)}
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
          <MaterialCommunityIcons name="wallet-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
        </View>
      </View>

      <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-sans text-sm text-text-muted">Cash & Bank</Text>
          <Text className="font-sans text-lg font-semibold text-text" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {formatCurrency(summary.assets, currencyCode, locale)}
          </Text>
        </View>
        <View className="h-px bg-surface-border" />
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-sans text-sm text-text-muted">Credit Card Outstanding</Text>
          <Text className="font-sans text-lg font-semibold text-accent-rose" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            -{formatCurrency(summary.liabilities, currencyCode, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}

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
  const [archiveCandidate, setArchiveCandidate] = useState<AccountApi | null>(null);
  const [form, setForm] = useState<AccountFormState>(EMPTY_FORM);
  const [formVisible, setFormVisible] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<AccountFormTouched>({});
  const saveBannerResponder = useMemo(
    () =>
      PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 16,
      onPanResponderRelease: (_event, gesture) => {
        if (Math.abs(gesture.dx) > 48) {
          setSaveMessage(null);
        }
      }
      }),
    []
  );
  const formErrors = useMemo(() => visibleAccountFormErrors(form, touched, submitted), [form, submitted, touched]);
  const allFormErrors = visibleAccountFormErrors(form, { name: true, openingBalance: true, type: true }, true);
  const hasFormError = Boolean(allFormErrors.name || allFormErrors.openingBalance || allFormErrors.type);
  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? setPrimaryMutation.error;
  const safeMutationError = mutationError ? toAppError(mutationError, "Account change could not be saved.") : null;
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const groupedAccounts = useMemo(
    () => ({
      "Cash & Bank": accounts.filter((account) => accountGroupFor(account) === "Cash & Bank"),
      "Credit Cards": accounts.filter((account) => accountGroupFor(account) === "Credit Cards"),
      "Other Accounts": accounts.filter((account) => accountGroupFor(account) === "Other Accounts")
    }),
    [accounts]
  );
  const hasCachedRefreshError = Boolean(accountsQuery.error && accounts.length > 0);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isEditMode = form.id !== null;

  useEffect(() => {
    if (!saveMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => setSaveMessage(null), 2500);

    return () => clearTimeout(timeout);
  }, [saveMessage]);

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setTouched({});
    setFormVisible(false);
  };

  const openCreateForm = () => {
    setSaveMessage(null);
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setTouched({});
    setFormVisible(true);
  };

  const openEditForm = (account: AccountApi) => {
    setSaveMessage(null);
    setForm({
      id: account.id,
      isPrimary: account.isPrimary,
      name: account.name,
      openingBalance: String(account.openingBalance),
      type: account.type
    });
    setSubmitted(false);
    setTouched({});
    setFormVisible(true);
  };

  const submit = () => {
    setSubmitted(true);
    setTouched({ name: true, openingBalance: true, type: true });

    if (hasFormError) {
      return;
    }

    const body = {
      isPrimary: form.isPrimary,
      name: form.name.trim(),
      openingBalance: Number(form.openingBalance),
      type: form.type
    };

    if (form.id) {
      updateMutation.mutate(
        {
          accountId: form.id,
          body
        },
        {
          onSuccess: () => {
            closeForm();
            setSaveMessage("Account updated.");
          }
        }
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: () => {
        closeForm();
        setSaveMessage("Account created.");
      }
    });
  };

  const archiveAccount = () => {
    if (!archiveCandidate) {
      return;
    }

    deleteMutation.mutate(archiveCandidate.id, {
      onSuccess: () => {
        setArchiveCandidate(null);
        setSaveMessage("Account archived.");
      }
    });
  };

  if (accountsQuery.isLoading && accounts.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="Accounts" description="Manage your vault accounts." />
        <LoadingSkeleton />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (accountsQuery.isError && accounts.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="Accounts" description="Manage your vault accounts." />
        <ErrorView message="Could not load accounts. Check that the server is running and try again." onRetry={() => accountsQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={() => accountsQuery.refetch()} refreshing={accountsQuery.isRefetching}>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="font-sans text-4xl font-bold text-text">Accounts</Text>
          <Text className="mt-2 font-sans text-base text-text-muted">All your accounts in one place</Text>
        </View>
        <Pressable
          accessibilityLabel="Add Account"
          accessibilityRole="button"
          className="flex-row items-center gap-2 rounded-full border border-brand-muted bg-surface px-2 py-1"
          onPress={openCreateForm}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand">
            <MaterialCommunityIcons name="plus" size={theme.icons.md} color={theme.colors.text.inverse} />
          </View>
          <Text className="pr-2 font-sans text-base font-semibold text-brand-soft">Add Account</Text>
        </Pressable>
      </View>

      {hasCachedRefreshError ? (
        <View className="gap-3 rounded-lg border border-state-warning bg-surface p-4">
          <Text className="font-sans text-sm font-semibold text-state-warning">Could not refresh accounts. Showing previously loaded data.</Text>
          <SecondaryButton onPress={() => accountsQuery.refetch()}>Retry</SecondaryButton>
        </View>
      ) : null}

      {saveMessage ? (
        <View className="flex-row items-center justify-between gap-3 rounded-lg border border-state-success bg-surface p-3" {...saveBannerResponder.panHandlers}>
          <Text className="font-sans text-sm font-semibold text-state-success">{saveMessage}</Text>
          <Pressable accessibilityLabel="Dismiss success message" accessibilityRole="button" onPress={() => setSaveMessage(null)}>
            <MaterialCommunityIcons name="close" size={theme.icons.xs} color={theme.colors.state.success} />
          </Pressable>
        </View>
      ) : null}

      {accounts.length > 0 ? <SummaryCard accounts={accounts} currencyCode={currencyCode} locale={locale} /> : null}

      {accounts.length === 0 ? (
        <EmptyState icon="wallet-plus-outline" title="No accounts yet" message="Create your first account to start tracking balances." />
      ) : (
        <View className="gap-6">
          {(["Cash & Bank", "Credit Cards", "Other Accounts"] as const).map((group) => (
            <AccountSection
              key={group}
              accounts={groupedAccounts[group]}
              currencyCode={currencyCode}
              group={group}
              locale={locale}
              onArchive={setArchiveCandidate}
              onEdit={openEditForm}
              onSetPrimary={(accountId) => setPrimaryMutation.mutate(accountId)}
              settingPrimary={setPrimaryMutation.isPending}
            />
          ))}
        </View>
      )}

      <BottomSheet visible={formVisible} title={isEditMode ? "Edit Account" : "Add Account"} onClose={closeForm} presentation="fullScreen">
        <View className="gap-3">
          {isEditMode ? <Text className="font-sans text-sm text-text-muted">Editing {form.name}</Text> : null}
          <FormField label="Account Name" error={formErrors.name}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="Account name"
              placeholderTextColor={theme.colors.text.muted}
              value={form.name}
            />
          </FormField>
          <FormField label="Account Type" error={formErrors.type}>
            <AccountTypeSelector
              selected={form.type || null}
              onSelect={(type: AccountType) => {
                setTouched((current) => ({ ...current, type: true }));
                setForm((current) => ({ ...current, type }));
              }}
            />
          </FormField>
          <FormField label="Opening Balance" error={formErrors.openingBalance}>
            <TextInput
              className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
              inputMode="decimal"
              onBlur={() => setTouched((current) => ({ ...current, openingBalance: true }))}
              onChangeText={(openingBalance) => setForm((current) => ({ ...current, openingBalance }))}
              placeholder="Enter amount"
              placeholderTextColor={theme.colors.text.muted}
              value={form.openingBalance}
            />
          </FormField>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.isPrimary }}
            className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-background p-4"
            onPress={() => setForm((current) => ({ ...current, isPrimary: !current.isPrimary }))}
          >
            <MaterialCommunityIcons
              name={form.isPrimary ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
              size={theme.icons.md}
              color={form.isPrimary ? theme.colors.brand.soft : theme.colors.text.muted}
            />
            <Text className="font-sans text-sm font-semibold text-text">Set as primary account</Text>
          </Pressable>
          {safeMutationError ? <Text className="font-sans text-sm text-state-danger">{safeMutationError.message}</Text> : null}
          <View className="flex-row gap-2">
            <PrimaryButton className="flex-1" loading={isSaving} onPress={submit}>
              {isEditMode ? "Save Changes" : "Save Account"}
            </PrimaryButton>
            <SecondaryButton className="flex-1" disabled={isSaving} onPress={closeForm}>
              Cancel
            </SecondaryButton>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet visible={Boolean(archiveCandidate)} title="Archive Account" onClose={() => setArchiveCandidate(null)}>
        <View className="gap-4">
          <Text className="font-sans text-base font-semibold text-text">{archiveCandidate?.name}</Text>
          <Text className="font-sans text-sm text-text-muted">
            If this account has financial history, Money Vault will mark it inactive and keep it in reports and existing transactions.
          </Text>
          <View className="flex-row gap-2">
            <PrimaryButton className="flex-1" loading={deleteMutation.isPending} onPress={archiveAccount}>
              Archive Account
            </PrimaryButton>
            <SecondaryButton className="flex-1" disabled={deleteMutation.isPending} onPress={() => setArchiveCandidate(null)}>
              Cancel
            </SecondaryButton>
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}
