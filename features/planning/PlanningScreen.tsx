import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui/CurrencyText";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Section } from "@/components/layout/Section";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import {
  useCloseActiveCycleMutation,
  usePlanningQuery,
  useSetCommitmentStatusMutation,
  useSetIncomeStatusMutation
} from "@/features/planning/api";
import type { PlanningItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function PlanningScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const planningQuery = usePlanningQuery(token, vaultId);
  const setIncomeStatus = useSetIncomeStatusMutation(token, vaultId);
  const setCommitmentStatus = useSetCommitmentStatusMutation(token, vaultId);
  const closeCycle = useCloseActiveCycleMutation(token, vaultId);
  const cycle = planningQuery.data?.cycle;
  const statusPayload = cycle
    ? {
        month: cycle.startMonth,
        year: cycle.startYear
      }
    : null;

  return (
    <Screen>
      <ScreenHeader title="Planning" description="Track cycle income, recurring commitments, and savings progress." />

      {planningQuery.isLoading ? (
        <View className="gap-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </View>
      ) : null}

      {planningQuery.isError ? <ErrorView message="Planning could not be loaded." onRetry={() => planningQuery.refetch()} /> : null}

      {planningQuery.data ? (
        <View className="gap-6">
          <View className="gap-3 rounded-lg border border-surface-border bg-surface p-5">
            <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">{planningQuery.data.cycle.status}</Text>
            <Text className="font-sans text-xl font-bold text-text">
              {planningQuery.data.cycle.startDate} → {planningQuery.data.cycle.endDate}
            </Text>
            <View className="h-2 rounded-full bg-background-muted">
              <View className="h-2 w-2/3 rounded-full bg-brand" />
            </View>
            <SecondaryButton disabled={closeCycle.isPending} onPress={() => closeCycle.mutate()}>
              Close active cycle
            </SecondaryButton>
          </View>

          <Section title="Cycle totals">
            <View className="flex-row flex-wrap gap-3">
              <PlanningStat label="Income received" value={planningQuery.data.totals.incomeReceived} currencyCode={currencyCode} locale={locale} />
              <PlanningStat label="Remaining commitments" value={planningQuery.data.totals.remainingCommitments} currencyCode={currencyCode} locale={locale} />
              <PlanningStat label="Expenses" value={planningQuery.data.totals.expenses} currencyCode={currencyCode} locale={locale} />
              <PlanningStat label="Projected savings" value={planningQuery.data.totals.projectedSavings} currencyCode={currencyCode} locale={locale} />
            </View>
          </Section>

          <PlanningItems
            title="Income templates"
            emptyTitle="No income templates"
            items={planningQuery.data.incomeTemplates}
            currencyCode={currencyCode}
            locale={locale}
            actionLabel="Mark received"
            resetLabel="Mark pending"
            onAction={(item) => {
              if (!statusPayload) {
                return;
              }
              setIncomeStatus.mutate({
                body: {
                  ...statusPayload,
                  actualAmount: item.amount,
                  status: "RECEIVED"
                },
                templateId: item.id
              });
            }}
            onReset={(item) => {
              if (!statusPayload) {
                return;
              }
              setIncomeStatus.mutate({
                body: {
                  ...statusPayload,
                  actualAmount: null,
                  status: "PENDING"
                },
                templateId: item.id
              });
            }}
          />

          <PlanningItems
            title="Commitments"
            emptyTitle="No commitments"
            items={planningQuery.data.commitments}
            currencyCode={currencyCode}
            locale={locale}
            actionLabel="Mark paid"
            resetLabel="Mark pending"
            onAction={(item) => {
              if (!statusPayload) {
                return;
              }
              setCommitmentStatus.mutate({
                body: {
                  ...statusPayload,
                  actualAmount: item.amount,
                  status: "PAID"
                },
                commitmentId: item.id
              });
            }}
            onReset={(item) => {
              if (!statusPayload) {
                return;
              }
              setCommitmentStatus.mutate({
                body: {
                  ...statusPayload,
                  actualAmount: null,
                  status: "PENDING"
                },
                commitmentId: item.id
              });
            }}
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
  emptyTitle: string;
  items: PlanningItemApi[];
  locale: string;
  onAction: (item: PlanningItemApi) => void;
  onReset: (item: PlanningItemApi) => void;
  resetLabel: string;
  title: string;
}

function PlanningItems({ actionLabel, currencyCode, emptyTitle, items, locale, onAction, onReset, resetLabel, title }: PlanningItemsProps) {
  if (items.length === 0) {
    return (
      <Section title={title}>
        <EmptyState icon="calendar-check-outline" title={emptyTitle} message="Create recurring planning items from Settings once setup actions are enabled." />
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
                  {item.accountName ? ` · ${item.accountName}` : ""}
                </Text>
              </View>
              <CurrencyText value={item.status.actualAmount ?? item.amount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-sans text-xs font-semibold uppercase text-accent-gold">{item.status.status}</Text>
              <View className="flex-1 flex-row justify-end gap-2">
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
