import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";
import { CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import {
  useCloseActiveCycleMutation,
  useCreateCommitmentMutation,
  useCreateIncomeTemplateMutation,
  useDeleteCommitmentMutation,
  useDeleteIncomeTemplateMutation,
  usePlanningQuery,
  useSetCommitmentStatusMutation,
  useSetIncomeStatusMutation,
  useUpdateCommitmentMutation,
  useUpdateIncomeTemplateMutation
} from "@/features/planning/api";
import type { AccountApi, PlanningItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { theme } from "@/theme";

type PlanningKind = "income" | "commitment";

interface PlanningFormState {
  accountId: number | null;
  amount: string;
  dueDay: string;
  id: number | null;
  kind: PlanningKind;
  name: string;
}

const EMPTY_FORM: PlanningFormState = {
  accountId: null,
  amount: "",
  dueDay: "1",
  id: null,
  kind: "commitment",
  name: ""
};

export function PlanningScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const planningQuery = usePlanningQuery(token, vaultId);
  const accountsQuery = useAccountsQuery(token, vaultId);
  const setIncomeStatus = useSetIncomeStatusMutation(token, vaultId);
  const setCommitmentStatus = useSetCommitmentStatusMutation(token, vaultId);
  const createIncome = useCreateIncomeTemplateMutation(token, vaultId);
  const updateIncome = useUpdateIncomeTemplateMutation(token, vaultId);
  const deleteIncome = useDeleteIncomeTemplateMutation(token, vaultId);
  const createCommitment = useCreateCommitmentMutation(token, vaultId);
  const updateCommitment = useUpdateCommitmentMutation(token, vaultId);
  const deleteCommitment = useDeleteCommitmentMutation(token, vaultId);
  const closeCycle = useCloseActiveCycleMutation(token, vaultId);
  const [form, setForm] = useState<PlanningFormState>(EMPTY_FORM);
  const cycle = planningQuery.data?.cycle;
  const statusPayload = cycle
    ? {
        month: cycle.startMonth,
        year: cycle.startYear
      }
    : null;
  const formError = useMemo(() => {
    const amount = Number(form.amount);
    const dueDay = Number(form.dueDay);

    if (!form.name.trim()) {
      return "Name is required.";
    }

    if (!form.accountId) {
      return "Choose an account.";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      return "Due day must be between 1 and 31.";
    }

    return null;
  }, [form.accountId, form.amount, form.dueDay, form.name]);
  const isSaving = createIncome.isPending || updateIncome.isPending || createCommitment.isPending || updateCommitment.isPending;

  const submit = () => {
    if (formError || !form.accountId) {
      return;
    }

    const body = {
      accountId: form.accountId,
      amount: Number(form.amount),
      dueDay: Number(form.dueDay),
      name: form.name.trim()
    };

    if (form.kind === "income") {
      if (form.id) {
        updateIncome.mutate(
          {
            body,
            templateId: form.id
          },
          {
            onSuccess: () => setForm(EMPTY_FORM)
          }
        );
        return;
      }

      createIncome.mutate(body, {
        onSuccess: () => setForm(EMPTY_FORM)
      });
      return;
    }

    if (form.id) {
      updateCommitment.mutate(
        {
          body,
          commitmentId: form.id
        },
        {
          onSuccess: () => setForm(EMPTY_FORM)
        }
      );
      return;
    }

    createCommitment.mutate(body, {
      onSuccess: () => setForm(EMPTY_FORM)
    });
  };

  const editItem = (item: PlanningItemApi, kind: PlanningKind) => {
    setForm({
      accountId: item.accountId ?? null,
      amount: String(item.amount),
      dueDay: String(item.dueDay),
      id: item.id,
      kind,
      name: item.name
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Planning" description="Track cycle income, recurring commitments, and savings progress." />

      {planningQuery.isLoading || accountsQuery.isLoading ? (
        <View className="gap-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </View>
      ) : null}

      {planningQuery.isError ? <ErrorView message="Planning could not be loaded." onRetry={() => planningQuery.refetch()} /> : null}
      {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => accountsQuery.refetch()} /> : null}

      {planningQuery.data ? (
        <View className="gap-6">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-5">
            <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">{planningQuery.data.cycle.status}</Text>
            <Text className="font-sans text-xl font-bold text-text">
              {planningQuery.data.cycle.startDate} to {planningQuery.data.cycle.endDate}
            </Text>
            <View className="h-2 rounded-full bg-background-muted">
              <View className="h-2 w-2/3 rounded-full bg-brand" />
            </View>
            <SecondaryButton disabled={closeCycle.isPending} onPress={() => closeCycle.mutate()}>
              Close active cycle
            </SecondaryButton>
          </View>

          <Section title={form.id ? "Edit planning item" : "Add planning item"}>
            <View className="gap-4 rounded-lg border border-surface-border bg-surface p-4">
              <View className="flex-row gap-2">
                <SecondaryButton
                  className={form.kind === "commitment" ? "border-brand-soft" : undefined}
                  onPress={() => setForm((current) => ({ ...current, kind: "commitment" }))}
                >
                  Commitment
                </SecondaryButton>
                <SecondaryButton
                  className={form.kind === "income" ? "border-brand-soft" : undefined}
                  onPress={() => setForm((current) => ({ ...current, kind: "income" }))}
                >
                  Income
                </SecondaryButton>
              </View>
              <FormField label="Name" error={formError?.includes("Name") ? formError : undefined}>
                <TextInput
                  className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                  onChangeText={(name) => setForm((current) => ({ ...current, name }))}
                  placeholder={form.kind === "income" ? "Salary" : "Electricity bill"}
                  placeholderTextColor={theme.colors.text.muted}
                  value={form.name}
                />
              </FormField>
              <FormField label="Account" error={formError?.includes("account") ? formError : undefined}>
                <AccountPicker accounts={accountsQuery.data ?? []} selectedId={form.accountId} onSelect={(accountId) => setForm((current) => ({ ...current, accountId }))} />
              </FormField>
              <View className="flex-row gap-3">
                <View className="flex-1">
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
                </View>
                <View className="w-28">
                  <FormField label="Due day" error={formError?.includes("Due day") ? formError : undefined}>
                    <TextInput
                      className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                      inputMode="numeric"
                      onChangeText={(dueDay) => setForm((current) => ({ ...current, dueDay }))}
                      placeholder="1"
                      placeholderTextColor={theme.colors.text.muted}
                      value={form.dueDay}
                    />
                  </FormField>
                </View>
              </View>
              <View className="flex-row gap-2">
                <PrimaryButton disabled={Boolean(formError) || isSaving} onPress={submit}>
                  {form.id ? "Save item" : "Add item"}
                </PrimaryButton>
                {form.id ? <SecondaryButton onPress={() => setForm(EMPTY_FORM)}>Cancel</SecondaryButton> : null}
              </View>
            </View>
          </Section>

          <Section title="Cycle totals">
            <View className="flex-row flex-wrap gap-3">
              <PlanningStat label="Income received" value={planningQuery.data.totals.incomeReceived} currencyCode={currencyCode} locale={locale} />
              <PlanningStat label="Remaining commitments" value={planningQuery.data.totals.remainingCommitments} currencyCode={currencyCode} locale={locale} />
              <PlanningStat label="Expenses" value={planningQuery.data.totals.expenses} currencyCode={currencyCode} locale={locale} />
              <PlanningStat label="Projected savings" value={planningQuery.data.totals.projectedSavings} currencyCode={currencyCode} locale={locale} />
            </View>
          </Section>

          <PlanningItems
            actionLabel="Mark received"
            currencyCode={currencyCode}
            deletePending={deleteIncome.isPending}
            emptyTitle="No income templates"
            items={planningQuery.data.incomeTemplates}
            kind="income"
            locale={locale}
            onAction={(item) => {
              if (statusPayload) {
                setIncomeStatus.mutate({
                  body: {
                    ...statusPayload,
                    actualAmount: item.amount,
                    status: "RECEIVED"
                  },
                  templateId: item.id
                });
              }
            }}
            onDelete={(item) => deleteIncome.mutate(item.id)}
            onEdit={editItem}
            onReset={(item) => {
              if (statusPayload) {
                setIncomeStatus.mutate({
                  body: {
                    ...statusPayload,
                    actualAmount: null,
                    status: "PENDING"
                  },
                  templateId: item.id
                });
              }
            }}
            resetLabel="Mark pending"
            title="Income templates"
          />

          <PlanningItems
            actionLabel="Mark paid"
            currencyCode={currencyCode}
            deletePending={deleteCommitment.isPending}
            emptyTitle="No commitments"
            items={planningQuery.data.commitments}
            kind="commitment"
            locale={locale}
            onAction={(item) => {
              if (statusPayload) {
                setCommitmentStatus.mutate({
                  body: {
                    ...statusPayload,
                    actualAmount: item.amount,
                    status: "PAID"
                  },
                  commitmentId: item.id
                });
              }
            }}
            onDelete={(item) => deleteCommitment.mutate(item.id)}
            onEdit={editItem}
            onReset={(item) => {
              if (statusPayload) {
                setCommitmentStatus.mutate({
                  body: {
                    ...statusPayload,
                    actualAmount: null,
                    status: "PENDING"
                  },
                  commitmentId: item.id
                });
              }
            }}
            resetLabel="Mark pending"
            title="Commitments"
          />
        </View>
      ) : null}
    </Screen>
  );
}

interface PlanningStatProps {
  currencyCode: string;
  label: string;
  locale: string;
  value: number;
}

function PlanningStat({ currencyCode, label, locale, value }: PlanningStatProps) {
  return (
    <View className="gap-1 rounded-lg border border-surface-border bg-surface p-4">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="text-lg font-semibold" />
    </View>
  );
}

interface PlanningItemsProps {
  actionLabel: string;
  currencyCode: string;
  deletePending: boolean;
  emptyTitle: string;
  items: PlanningItemApi[];
  kind: PlanningKind;
  locale: string;
  onAction: (item: PlanningItemApi) => void;
  onDelete: (item: PlanningItemApi) => void;
  onEdit: (item: PlanningItemApi, kind: PlanningKind) => void;
  onReset: (item: PlanningItemApi) => void;
  resetLabel: string;
  title: string;
}

function PlanningItems({
  actionLabel,
  currencyCode,
  deletePending,
  emptyTitle,
  items,
  kind,
  locale,
  onAction,
  onDelete,
  onEdit,
  onReset,
  resetLabel,
  title
}: PlanningItemsProps) {
  if (items.length === 0) {
    return (
      <Section title={title}>
        <EmptyState icon="calendar-check-outline" title={emptyTitle} message="Recurring planning items will appear here." />
      </Section>
    );
  }

  return (
    <Section title={title}>
      <View className="gap-3">
        {items.map((item) => (
          <View key={item.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="font-sans text-base font-semibold text-text">{item.name}</Text>
                <Text className="font-sans text-xs text-text-muted">
                  Due day {item.dueDay}
                  {item.accountName ? ` - ${item.accountName}` : ""}
                </Text>
              </View>
              <CurrencyText value={item.status.actualAmount ?? item.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">{item.status.status}</Text>
              <View className="flex-1 flex-row flex-wrap justify-end gap-2">
                <SecondaryButton className="h-10 px-3" onPress={() => onEdit(item, kind)}>
                  Edit
                </SecondaryButton>
                <SecondaryButton className="h-10 px-3" disabled={deletePending} onPress={() => onDelete(item)}>
                  Delete
                </SecondaryButton>
                <SecondaryButton className="h-10 px-3" onPress={() => onReset(item)}>
                  {resetLabel}
                </SecondaryButton>
                <SecondaryButton className="h-10 px-3" onPress={() => onAction(item)}>
                  {actionLabel}
                </SecondaryButton>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

interface AccountPickerProps {
  accounts: AccountApi[];
  onSelect: (accountId: number) => void;
  selectedId: number | null;
}

function AccountPicker({ accounts, onSelect, selectedId }: AccountPickerProps) {
  if (accounts.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">Add an account before creating planning items.</Text>;
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
