import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { BottomSheet, CurrencyText, EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts/api";
import { useDashboardQuery } from "@/features/dashboard/api";
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
import {
  buildCloseReviewItems,
  buildPlanningActivities,
  closeActionStatus,
  cycleCompletionLabel,
  cycleProgressPercent,
  daysRemainingLabel,
  pendingCloseActivities,
  statusPayloadForActivity,
  upcomingTimelineLabel,
  validateCloseReview
} from "@/features/planning/planningModel";
import type { CloseReviewItem, PlanningActivityViewModel } from "@/features/planning/planningModel";
import type { AccountApi, PlanningItemApi } from "@/services/api/types";
import { formatIsoDateOnly } from "@/lib/date";
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

const statusClasses: Record<string, string> = {
  CANCELLED: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
  CARRIED_FORWARD: "border-state-warning/40 bg-state-warning/10 text-state-warning",
  PAID: "border-state-success/40 bg-accent-emerald/10 text-state-success",
  PENDING: "border-surface-border bg-background-muted text-text-muted",
  RECEIVED: "border-state-success/40 bg-accent-emerald/10 text-state-success"
};

const cardClassName = "rounded-xl border border-surface-border bg-surface/90";
const planningAccent = {
  amber: "#FB923C",
  blue: "#60A5FA",
  green: "#4ADE80",
  orange: "#F59E0B",
  purple: "#A78BFA",
  red: "#F87171"
};

export function PlanningScreen() {
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const planningQuery = usePlanningQuery(token, vaultId);
  const dashboardQuery = useDashboardQuery(token, vaultId);
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
  const [formVisible, setFormVisible] = useState(false);
  const [incomeExpanded, setIncomeExpanded] = useState(true);
  const [commitmentsExpanded, setCommitmentsExpanded] = useState(true);
  const [closeVisible, setCloseVisible] = useState(false);
  const [closeItems, setCloseItems] = useState<CloseReviewItem[]>([]);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [savingClose, setSavingClose] = useState(false);
  const planning = planningQuery.data;
  const dashboardCycle = dashboardQuery.data?.cycle ?? null;
  const activities = useMemo(() => (planning ? buildPlanningActivities(planning) : []), [planning]);
  const pendingActivities = pendingCloseActivities(activities);
  const statusPayload = planning
    ? {
        month: planning.cycle.startMonth,
        year: planning.cycle.startYear
      }
    : null;
  const formError = useMemo(() => validatePlanningForm(form), [form]);
  const isSaving = createIncome.isPending || updateIncome.isPending || createCommitment.isPending || updateCommitment.isPending;
  const refreshing = planningQuery.isRefetching || dashboardQuery.isRefetching || accountsQuery.isRefetching;

  const refresh = () => {
    void planningQuery.refetch();
    void dashboardQuery.refetch();
    void accountsQuery.refetch();
  };

  function openAddForm(kind: PlanningKind) {
    setForm({ ...EMPTY_FORM, kind });
    setFormVisible(true);
  }

  function closeForm() {
    setForm(EMPTY_FORM);
    setFormVisible(false);
  }

  function submitForm() {
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
        updateIncome.mutate({ body, templateId: form.id }, { onSuccess: closeForm });
        return;
      }

      createIncome.mutate(body, { onSuccess: closeForm });
      return;
    }

    if (form.id) {
      updateCommitment.mutate({ body, commitmentId: form.id }, { onSuccess: closeForm });
      return;
    }

    createCommitment.mutate(body, { onSuccess: closeForm });
  }

  function editItem(item: PlanningItemApi, kind: PlanningKind) {
    setForm({
      accountId: item.accountId ?? null,
      amount: String(item.amount),
      dueDay: String(item.dueDay),
      id: item.id,
      kind,
      name: item.name
    });
    setFormVisible(true);
  }

  function completeActivity(activity: PlanningActivityViewModel) {
    if (!planning || !statusPayload) {
      return;
    }

    const payload = statusPayloadForActivity(activity, planning.cycle, activity.completeStatus, activity.actualAmount);

    if (activity.kind === "income") {
      setIncomeStatus.mutate({ body: payload, templateId: activity.id });
      return;
    }

    setCommitmentStatus.mutate({ body: payload, commitmentId: activity.id });
  }

  function cancelActivity(activity: PlanningActivityViewModel) {
    if (!planning) {
      return;
    }

    const payload = statusPayloadForActivity(activity, planning.cycle, "CANCELLED", 0);

    if (activity.kind === "income") {
      setIncomeStatus.mutate({ body: payload, templateId: activity.id });
      return;
    }

    setCommitmentStatus.mutate({ body: payload, commitmentId: activity.id });
  }

  function resetActivity(activity: PlanningActivityViewModel) {
    if (!planning) {
      return;
    }

    const payload = statusPayloadForActivity(activity, planning.cycle, "PENDING", null);

    if (activity.kind === "income") {
      setIncomeStatus.mutate({ body: payload, templateId: activity.id });
      return;
    }

    setCommitmentStatus.mutate({ body: payload, commitmentId: activity.id });
  }

  function openCloseReview() {
    setCloseItems(buildCloseReviewItems(activities));
    setCloseError(null);
    setCloseVisible(true);
  }

  async function submitCloseReview() {
    if (!planning) {
      return;
    }

    const validation = validateCloseReview(closeItems);
    if (validation) {
      setCloseError(validation);
      return;
    }

    setSavingClose(true);
    setCloseError(null);

    try {
      for (const item of closeItems) {
        if (!item.action) {
          continue;
        }

        const status = closeActionStatus(item.action, item.activity.kind);
        const amount = item.action === "Cancelled" ? 0 : Number(item.amount);
        const payload = statusPayloadForActivity(item.activity, planning.cycle, status, amount);

        if (status === "CARRIED_FORWARD") {
          throw new Error("Carry Forward requires the legacy finalize_month backend route.");
        }

        if (item.activity.kind === "income") {
          await setIncomeStatus.mutateAsync({ body: payload, templateId: item.activity.id });
        } else {
          await setCommitmentStatus.mutateAsync({ body: payload, commitmentId: item.activity.id });
        }
      }

      await closeCycle.mutateAsync();
      setCloseVisible(false);
      refresh();
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "Cycle could not be closed.");
    } finally {
      setSavingClose(false);
    }
  }

  if ((planningQuery.isLoading || dashboardQuery.isLoading) && !planning) {
    return (
      <Screen>
        <PlanningHeader />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </Screen>
    );
  }

  if (planningQuery.isError && !planning) {
    return (
      <Screen>
        <PlanningHeader />
        <ErrorView message="Planning could not be loaded." onRetry={() => void planningQuery.refetch()} />
      </Screen>
    );
  }

  if (!planning) {
    return (
      <Screen>
        <PlanningHeader />
        <EmptyState icon="calendar-check-outline" title="No planning data" message="Planning data was not returned for this vault." />
      </Screen>
    );
  }

  return (
    <>
      <Screen onRefresh={refresh} refreshing={refreshing}>
        <PlanningHeader />
        {dashboardQuery.isError ? <ErrorView message="Cycle progress could not be loaded." onRetry={() => void dashboardQuery.refetch()} /> : null}
        {accountsQuery.isError ? <ErrorView message="Accounts could not be loaded." onRetry={() => void accountsQuery.refetch()} /> : null}
        <CurrentCycleCard cycle={planning.cycle} dashboardCycle={dashboardCycle} currencyCode={currencyCode} locale={locale} projectedSavings={planning.totals.projectedSavings} />
        <PlanningSummary totals={planning.totals} currencyCode={currencyCode} locale={locale} />
        <ActivitiesSection
          activities={activities}
          currencyCode={currencyCode}
          locale={locale}
          onCancel={cancelActivity}
          onComplete={completeActivity}
          onReset={resetActivity}
        />
        <TemplateSection
          expanded={incomeExpanded}
          kind="income"
          items={planning.incomeTemplates}
          locale={locale}
          currencyCode={currencyCode}
          onAdd={() => openAddForm("income")}
          onDelete={(item) => deleteIncome.mutate(item.id)}
          onEdit={(item) => editItem(item, "income")}
          onToggle={() => setIncomeExpanded((value) => !value)}
          title="Recurring Income"
        />
        <TemplateSection
          expanded={commitmentsExpanded}
          kind="commitment"
          items={planning.commitments}
          locale={locale}
          currencyCode={currencyCode}
          onAdd={() => openAddForm("commitment")}
          onDelete={(item) => deleteCommitment.mutate(item.id)}
          onEdit={(item) => editItem(item, "commitment")}
          onToggle={() => setCommitmentsExpanded((value) => !value)}
          title="Recurring Commitments"
        />
        <TimelineSection activities={activities} cycle={planning.cycle} currencyCode={currencyCode} locale={locale} />
        <ReadyToCloseSection
          canClose={planning.cycle.status === "Current"}
          currencyCode={currencyCode}
          locale={locale}
          pendingCount={pendingActivities.length}
          projectedSavings={planning.totals.projectedSavings}
          saving={closeCycle.isPending || savingClose}
          totalCount={activities.length}
          onClose={openCloseReview}
        />
        <PlanningDock
          currencyCode={currencyCode}
          cycle={planning.cycle}
          dashboardCycle={dashboardCycle}
          locale={locale}
          projectedSavings={planning.totals.projectedSavings}
          remainingCommitments={planning.totals.remainingCommitments}
        />
      </Screen>

      <PlanningFormSheet
        accounts={accountsQuery.data ?? []}
        error={formError}
        form={form}
        isSaving={isSaving}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={submitForm}
        visible={formVisible}
      />

      <CloseCycleSheet
        currencyCode={currencyCode}
        error={closeError}
        items={closeItems}
        locale={locale}
        onChange={setCloseItems}
        onClose={() => setCloseVisible(false)}
        onSubmit={() => void submitCloseReview()}
        saving={savingClose || closeCycle.isPending}
        visible={closeVisible}
      />
    </>
  );
}

function PlanningHeader() {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="h-12 w-12 items-center justify-center rounded-lg border border-surface-border bg-surface-raised">
        <MaterialCommunityIcons name="chevron-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-2xl font-bold text-text" numberOfLines={1}>
          Planning
        </Text>
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
          Plan • Execute • Close
        </Text>
      </View>
      <View className="h-12 w-12 items-center justify-center rounded-lg border border-surface-border bg-surface-raised">
        <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.md} color={theme.colors.brand.soft} />
      </View>
    </View>
  );
}

function CurrentCycleCard({
  cycle,
  dashboardCycle,
  currencyCode,
  locale,
  projectedSavings
}: {
  cycle: { endDate: string; startDate: string; status: string };
  dashboardCycle: { daysCompleted: number; daysRemaining: number; displayName: string; progressPercent: number; totalDays: number } | null;
  currencyCode: string;
  locale: string;
  projectedSavings: number;
}) {
  const progress = cycleProgressPercent(dashboardCycle);
  const displayName = dashboardCycle?.displayName ?? `${cycle.startDate} to ${cycle.endDate}`;
  const attention = dashboardCycle && dashboardCycle.daysRemaining > 19 ? `${dashboardCycle.daysRemaining - 19} items need your attention` : "All up to date";

  return (
    <View className="gap-4 rounded-xl border border-brand-muted/70 bg-brand-deep/70 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-background-muted/60">
              <MaterialCommunityIcons name="chevron-left" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
            </View>
            <Text className="font-sans text-2xl font-bold text-text" numberOfLines={1}>
              {displayName.split(" ")[0]} {cycle.startDate.slice(0, 4)}
            </Text>
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-background-muted/60">
              <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
            </View>
          </View>
          <Text className="mt-2 font-sans text-base text-text" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="mt-1 font-sans text-sm text-text-muted">
            {formatIsoDateOnly(cycle.startDate, locale)} to {formatIsoDateOnly(cycle.endDate, locale)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-sans text-sm text-text-muted">Day {dashboardCycle?.daysCompleted ?? 0} of {dashboardCycle?.totalDays ?? 0}</Text>
          <Text className="font-sans text-3xl font-bold text-text">{progress}%</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-2">
          <View className="h-4 w-4 rounded-full bg-accent-emerald" />
          <Text className="font-sans text-sm text-text">{cycle.status}</Text>
        </View>
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-background-muted">
          <View className="h-full rounded-full bg-accent-emerald" style={{ width: `${progress}%` }} />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <HeroFact icon="calendar-month-outline" label="Started" value={formatIsoDateOnly(cycle.startDate, locale, { day: "numeric", month: "short", year: "numeric" })} />
        <HeroFact icon="check-circle-outline" label="Completed" value={cycleCompletionLabel(dashboardCycle).replace("/", " / ")} />
        <HeroFact icon="clock-outline" label="Remaining" value={daysRemainingLabel(dashboardCycle)} />
        <HeroMoneyFact currencyCode={currencyCode} icon="bullseye-arrow" label="Projected Savings" locale={locale} value={projectedSavings} />
      </View>
      <View className="flex-row items-center gap-3 border-t border-surface-border pt-3">
        <View className="h-8 w-8 items-center justify-center rounded-full border border-accent-emerald/50 bg-accent-emerald/10">
          <MaterialCommunityIcons name="trending-up" size={theme.icons.sm} color={planningAccent.green} />
        </View>
        <Text className="font-sans text-sm font-semibold text-state-success">On Track</Text>
        <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
          Income received • Commitments in progress
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
          {attention}
        </Text>
      </View>
    </View>
  );
}

function PlanningSummary({ currencyCode, locale, totals }: { currencyCode: string; locale: string; totals: { commitmentsCompleted: number; commitmentsPlanned: number; incomePlanned: number; incomeReceived: number; projectedSavings: number; remainingCommitments: number; savingsGoal: number } }) {
  return (
    <View className="gap-3">
      <SectionTitle title="Planning Summary" />
      <View className="flex-row gap-3">
        <SummaryCard
          title="Income"
          icon="wallet-outline"
          tone="green"
          currencyCode={currencyCode}
          locale={locale}
          planned={totals.incomePlanned}
          actual={totals.incomeReceived}
          remaining={Math.max(totals.incomePlanned - totals.incomeReceived, 0)}
        />
        <SummaryCard
          title="Commitments"
          icon="calendar-month-outline"
          tone="orange"
          currencyCode={currencyCode}
          locale={locale}
          planned={totals.commitmentsPlanned}
          actual={totals.commitmentsCompleted}
          remaining={totals.remainingCommitments}
        />
        <SummaryCard
          title="Savings"
          icon="bullseye-arrow"
          tone="purple"
          currencyCode={currencyCode}
          locale={locale}
          planned={totals.savingsGoal}
          actual={totals.projectedSavings}
          remaining={Math.max(totals.savingsGoal - totals.projectedSavings, 0)}
        />
      </View>
    </View>
  );
}

function SummaryCard({
  actual,
  currencyCode,
  icon,
  locale,
  planned,
  remaining,
  title,
  tone
}: {
  actual: number;
  currencyCode: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  locale: string;
  planned: number;
  remaining: number;
  title: string;
  tone: "green" | "orange" | "purple";
}) {
  const percent = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0;
  const difference = actual - planned;
  const color = tone === "green" ? planningAccent.green : tone === "orange" ? planningAccent.orange : planningAccent.purple;
  const label = title === "Income" ? "Received" : title === "Commitments" ? "Paid" : "Projected";

  return (
    <View className={`${cardClassName} min-h-48 flex-1 justify-between p-3`}>
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-background-muted">
            <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={color} />
          </View>
          <Text className="font-sans text-xs font-bold uppercase text-text" numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View className="gap-2">
          <SummaryMoney label={title === "Savings" ? "Goal" : "Planned"} value={planned} currencyCode={currencyCode} locale={locale} />
          <SummaryMoney label={label} value={actual} currencyCode={currencyCode} locale={locale} colorClass={tone === "green" ? "text-state-success" : tone === "orange" ? "text-state-warning" : "text-brand-soft"} />
          {title !== "Income" ? <SummaryMoney label={title === "Savings" ? "Difference" : "Remaining"} value={title === "Savings" ? difference : remaining} currencyCode={currencyCode} locale={locale} colorClass={title === "Commitments" ? "text-state-warning" : "text-state-success"} signed={title === "Savings"} /> : null}
        </View>
      </View>
      <View className="self-end rounded-full border border-brand-muted bg-brand-deep px-3 py-1">
        <Text className="font-sans text-sm font-bold" style={{ color }}>
          {percent}%
        </Text>
      </View>
    </View>
  );
}

function ActivitiesSection({
  activities,
  currencyCode,
  locale,
  onCancel,
  onComplete,
  onReset
}: {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  locale: string;
  onCancel: (activity: PlanningActivityViewModel) => void;
  onComplete: (activity: PlanningActivityViewModel) => void;
  onReset: (activity: PlanningActivityViewModel) => void;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <SectionTitle title="Financial Cycle Activities" />
        <View className="flex-row items-center gap-2">
          <Text className="font-sans text-sm text-text-muted">All up to date</Text>
          <View className="h-6 w-6 items-center justify-center rounded-full bg-accent-emerald/20">
            <MaterialCommunityIcons name="check" size={theme.icons.xs} color={planningAccent.green} />
          </View>
        </View>
      </View>
      {activities.length === 0 ? (
        <EmptyState icon="calendar-check-outline" title="No activities" message="Income and commitments will appear here." />
      ) : (
        <View className={`${cardClassName} overflow-hidden px-3`}>
          {activities.map((activity) => (
            <ActivityCard
              key={`${activity.kind}:${activity.id}`}
              activity={activity}
              currencyCode={currencyCode}
              locale={locale}
              onCancel={onCancel}
              onComplete={onComplete}
              onReset={onReset}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ActivityCard({
  activity,
  currencyCode,
  locale,
  onCancel,
  onComplete,
  onReset
}: {
  activity: PlanningActivityViewModel;
  currencyCode: string;
  locale: string;
  onCancel: (activity: PlanningActivityViewModel) => void;
  onComplete: (activity: PlanningActivityViewModel) => void;
  onReset: (activity: PlanningActivityViewModel) => void;
}) {
  const isPending = activity.status === "PENDING";
  const isIncome = activity.kind === "income";
  const iconColor = isIncome ? planningAccent.green : activity.icon === "home-outline" ? planningAccent.amber : activity.icon === "credit-card-outline" ? planningAccent.red : planningAccent.purple;

  return (
    <View className="gap-3 border-b border-surface-border py-3 last:border-b-0">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-background-muted">
          {activity.kind === "income" ? (
            <MaterialCommunityIcons name="cash" size={theme.icons.sm} color={iconColor} />
          ) : (
            <MaterialCommunityIcons name={activity.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={theme.icons.sm} color={iconColor} />
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
            {activity.name}
          </Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
            Due day {activity.dueDay}
            {activity.accountName ? ` • ${activity.accountName}` : ""}
          </Text>
        </View>
        <StatusBadge label={activity.statusLabel} status={activity.status} />
      </View>
      <View className="flex-row gap-3">
        <MoneyFact label="Expected" value={activity.expectedAmount} currencyCode={currencyCode} locale={locale} />
        <MoneyFact label="Actual" value={activity.actualAmount} currencyCode={currencyCode} locale={locale} />
      </View>
      <View className="flex-row flex-wrap gap-2">
        {isPending ? (
          <>
            <SecondaryButton className="h-10 px-3" icon="check-circle-outline" onPress={() => onComplete(activity)}>
              {activity.completeLabel}
            </SecondaryButton>
            <SecondaryButton className="h-10 px-3" icon="close-circle-outline" onPress={() => onCancel(activity)}>
              Cancel
            </SecondaryButton>
          </>
        ) : (
          <SecondaryButton className="h-10 px-3" icon="restore" onPress={() => onReset(activity)}>
            Mark pending
          </SecondaryButton>
        )}
      </View>
    </View>
  );
}

function TemplateSection({
  currencyCode,
  expanded,
  items,
  kind,
  locale,
  onAdd,
  onDelete,
  onEdit,
  onToggle,
  title
}: {
  currencyCode: string;
  expanded: boolean;
  items: PlanningItemApi[];
  kind: PlanningKind;
  locale: string;
  onAdd: () => void;
  onDelete: (item: PlanningItemApi) => void;
  onEdit: (item: PlanningItemApi) => void;
  onToggle: () => void;
  title: string;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Pressable accessibilityRole="button" className="min-w-0 flex-1 flex-row items-center gap-2" onPress={onToggle}>
          <MaterialCommunityIcons name={expanded ? "chevron-down" : "chevron-right"} size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
          <Text className="font-sans text-lg font-bold text-text">{title}</Text>
        </Pressable>
        <SecondaryButton className="h-10 px-3" icon="plus-circle-outline" onPress={onAdd}>
          {kind === "income" ? "Add Income" : "Add Commitment"}
        </SecondaryButton>
      </View>
      {expanded ? (
        items.length === 0 ? (
          <EmptyState icon="calendar-check-outline" title={kind === "income" ? "No income templates" : "No commitments"} message="Recurring planning items will appear here." />
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <View key={item.id} className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
                      Due day {item.dueDay}
                      {item.accountName ? ` • ${item.accountName}` : ""}
                    </Text>
                  </View>
                  <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className="text-base font-semibold" />
                </View>
                <View className="flex-row gap-2">
                  <SecondaryButton className="h-10 flex-1 px-3" icon="pencil-outline" onPress={() => onEdit(item)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton className="h-10 flex-1 px-3" icon="delete-outline" onPress={() => onDelete(item)}>
                    Delete
                  </SecondaryButton>
                </View>
              </View>
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}

function TimelineSection({
  activities,
  currencyCode,
  cycle,
  locale
}: {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  cycle: { startMonth: number; startYear: number };
  locale: string;
}) {
  const timeline = activities.filter((activity) => activity.status === "PENDING" || activity.status === "CARRIED_FORWARD").slice(0, 6);

  return (
    <View className="gap-3">
      <SectionTitle title="Upcoming Timeline" subtitle="Outstanding activity ordered by legacy due day." />
      {timeline.length === 0 ? (
        <EmptyState icon="timeline-clock-outline" title="Nothing upcoming" message="All planning activities are resolved for this cycle." />
      ) : (
        <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
          {timeline.map((activity) => (
            <View key={`${activity.kind}:${activity.id}`} className="flex-row items-center gap-3 border-b border-surface-border pb-3 last:border-b-0 last:pb-0">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-deep">
                <MaterialCommunityIcons name={activity.kind === "income" ? "cash" : (activity.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"])} size={theme.icons.sm} color={theme.colors.brand.soft} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                  {activity.name}
                </Text>
                <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
                  {upcomingTimelineLabel(activity, cycle)}
                </Text>
              </View>
              <CurrencyText value={activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ReadyToCloseSection({
  canClose,
  currencyCode,
  locale,
  onClose,
  pendingCount,
  projectedSavings,
  saving,
  totalCount
}: {
  canClose: boolean;
  currencyCode: string;
  locale: string;
  onClose: () => void;
  pendingCount: number;
  projectedSavings: number;
  saving: boolean;
  totalCount: number;
}) {
  const completed = Math.max(totalCount - pendingCount, 0);
  const percent = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 100;

  return (
    <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-lg font-bold text-text">Ready to Close</Text>
        <Text className="font-sans text-sm font-semibold text-brand-soft">{percent}%</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-background-muted">
        <View className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </View>
      <View className="flex-row gap-3">
        <Fact label="Remaining work" value={`${pendingCount} items`} />
        <View className="min-w-[45%] flex-1 rounded-lg bg-background-muted p-3">
          <Text className="font-sans text-xs text-text-muted">Projected savings</Text>
          <CurrencyText value={projectedSavings} currencyCode={currencyCode} locale={locale} className="mt-1 text-base font-semibold" />
        </View>
      </View>
      <PrimaryButton disabled={!canClose || saving} loading={saving} icon="lock-check-outline" onPress={onClose}>
        Close Cycle
      </PrimaryButton>
    </View>
  );
}

function PlanningFormSheet({
  accounts,
  error,
  form,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  visible
}: {
  accounts: AccountApi[];
  error: string | null;
  form: PlanningFormState;
  isSaving: boolean;
  onChange: (form: PlanningFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  visible: boolean;
}) {
  return (
    <BottomSheet visible={visible} title={form.id ? "Edit Planning Item" : "Add Planning Item"} onClose={onClose}>
      <View className="gap-4">
        <View className="flex-row gap-2">
          <SecondaryButton className={form.kind === "commitment" ? "flex-1 border-brand-soft" : "flex-1"} onPress={() => onChange({ ...form, kind: "commitment" })}>
            Commitment
          </SecondaryButton>
          <SecondaryButton className={form.kind === "income" ? "flex-1 border-brand-soft" : "flex-1"} onPress={() => onChange({ ...form, kind: "income" })}>
            Income
          </SecondaryButton>
        </View>
        <FormField label="Name">
          <TextInput
            className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
            onChangeText={(name) => onChange({ ...form, name })}
            placeholder={form.kind === "income" ? "Salary" : "Electricity bill"}
            placeholderTextColor={theme.colors.text.muted}
            value={form.name}
          />
        </FormField>
        <FormField label="Account">
          <AccountPicker accounts={accounts} selectedId={form.accountId} onSelect={(accountId) => onChange({ ...form, accountId })} />
        </FormField>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="Amount">
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={(amount) => onChange({ ...form, amount })}
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
                value={form.amount}
              />
            </FormField>
          </View>
          <View className="w-28">
            <FormField label="Due day">
              <TextInput
                className="h-12 rounded-md border border-surface-border bg-background px-4 font-sans text-base text-text"
                inputMode="numeric"
                keyboardType="number-pad"
                onChangeText={(dueDay) => onChange({ ...form, dueDay })}
                placeholder="1"
                placeholderTextColor={theme.colors.text.muted}
                value={form.dueDay}
              />
            </FormField>
          </View>
        </View>
        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
        <PrimaryButton disabled={Boolean(error) || isSaving} loading={isSaving} onPress={onSubmit}>
          {form.id ? "Save item" : "Add item"}
        </PrimaryButton>
      </View>
    </BottomSheet>
  );
}

function CloseCycleSheet({
  currencyCode,
  error,
  items,
  locale,
  onChange,
  onClose,
  onSubmit,
  saving,
  visible
}: {
  currencyCode: string;
  error: string | null;
  items: CloseReviewItem[];
  locale: string;
  onChange: (items: CloseReviewItem[]) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  visible: boolean;
}) {
  const paid = items.filter((item) => item.action === "Paid").length;
  const cancelled = items.filter((item) => item.action === "Cancelled").length;
  const carried = items.filter((item) => item.action === "Carry Forward").length;

  function updateItem(index: number, patch: Partial<CloseReviewItem>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <BottomSheet visible={visible} title="Close Cycle" onClose={onClose}>
      <View className="gap-4">
        {items.length === 0 ? (
          <Text className="font-sans text-sm text-text-muted">Everything has been completed.</Text>
        ) : (
          items.map((item, index) => (
            <View key={`${item.activity.kind}:${item.activity.id}`} className="gap-3 rounded-lg border border-surface-border bg-surface p-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                    {item.activity.name}
                  </Text>
                  <Text className="font-sans text-xs text-text-muted">Expected</Text>
                  <CurrencyText value={item.activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                </View>
                <TextInput
                  className="h-11 w-28 rounded-md border border-surface-border bg-background px-3 text-right font-sans text-base text-text"
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  value={item.amount}
                  onChangeText={(amount) => updateItem(index, { amount })}
                />
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(["Paid", "Cancelled", "Carry Forward"] as const).map((action) => (
                  <SecondaryButton
                    key={action}
                    className={item.action === action ? "h-10 border-brand-soft px-3" : "h-10 px-3"}
                    onPress={() => updateItem(index, { action })}
                  >
                    {action}
                  </SecondaryButton>
                ))}
              </View>
            </View>
          ))
        )}
        <View className="flex-row gap-3">
          <Fact label="Paid" value={String(paid)} />
          <Fact label="Cancelled" value={String(cancelled)} />
          <Fact label="Carry" value={String(carried)} />
        </View>
        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
        <View className="flex-row gap-3">
          <SecondaryButton className="flex-1" disabled={saving} onPress={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton className="flex-1" loading={saving} disabled={saving} onPress={onSubmit}>
            Close Cycle
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}

function AccountPicker({ accounts, onSelect, selectedId }: { accounts: AccountApi[]; onSelect: (accountId: number) => void; selectedId: number | null }) {
  if (accounts.length === 0) {
    return <Text className="font-sans text-sm text-text-muted">Create an account before adding a planning item.</Text>;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {accounts.map((account) => (
        <SecondaryButton key={account.id} className={selectedId === account.id ? "border-brand-soft" : undefined} onPress={() => onSelect(account.id)}>
          {account.name}
        </SecondaryButton>
      ))}
    </View>
  );
}

function HeroFact({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 border-r border-surface-border pr-3">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.text.muted} />
        <Text className="font-sans text-sm text-text">{label}</Text>
      </View>
      <Text className="mt-2 font-sans text-lg font-bold text-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function HeroMoneyFact({
  currencyCode,
  icon,
  label,
  locale,
  value
}: {
  currencyCode: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  locale: string;
  value: number;
}) {
  return (
    <View className="min-w-[45%] flex-1">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
        <Text className="font-sans text-sm text-text">{label}</Text>
      </View>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="mt-2 text-lg font-bold text-brand-soft" />
    </View>
  );
}

function SummaryMoney({
  colorClass,
  currencyCode,
  label,
  locale,
  signed = false,
  value
}: {
  colorClass?: string;
  currencyCode: string;
  label: string;
  locale: string;
  signed?: boolean;
  value: number;
}) {
  return (
    <View className="gap-0.5">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <View className="flex-row items-center">
        {signed && value > 0 ? <Text className="font-sans text-sm font-bold text-state-success">+</Text> : null}
        <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className={`text-sm font-bold ${colorClass ?? ""}`} />
      </View>
    </View>
  );
}

function PlanningDock({
  currencyCode,
  cycle,
  dashboardCycle,
  locale,
  projectedSavings,
  remainingCommitments
}: {
  currencyCode: string;
  cycle: { startDate: string };
  dashboardCycle: { daysCompleted: number; progressPercent: number; totalDays: number } | null;
  locale: string;
  projectedSavings: number;
  remainingCommitments: number;
}) {
  const progress = cycleProgressPercent(dashboardCycle);

  return (
    <View className={`${cardClassName} flex-row items-center gap-3 p-4`}>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-lg font-bold text-text" numberOfLines={1}>
          {formatIsoDateOnly(cycle.startDate, locale, { month: "long", year: "numeric" })}
        </Text>
        <Text className="font-sans text-xs text-text-muted">Day {dashboardCycle?.daysCompleted ?? 0} of {dashboardCycle?.totalDays ?? 0}</Text>
      </View>
      <View className="h-12 w-12 items-center justify-center rounded-full border-4 border-brand">
        <Text className="font-sans text-xs font-bold text-text">{progress}%</Text>
      </View>
      <DockMoney label="Remaining" value={remainingCommitments} currencyCode={currencyCode} locale={locale} colorClass="text-state-warning" />
      <DockMoney label="Projected" value={projectedSavings} currencyCode={currencyCode} locale={locale} colorClass="text-brand-soft" />
    </View>
  );
}

function DockMoney({ colorClass, currencyCode, label, locale, value }: { colorClass: string; currencyCode: string; label: string; locale: string; value: number }) {
  return (
    <View className="min-w-0 flex-1 border-l border-surface-border pl-3">
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className={`text-base font-bold ${colorClass}`} />
      <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function SectionTitle({ subtitle, title }: { subtitle?: string; title: string }) {
  return (
    <View className="gap-1">
      <Text className="font-sans text-lg font-bold text-text">{title}</Text>
      {subtitle ? <Text className="font-sans text-sm text-text-muted">{subtitle}</Text> : null}
    </View>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <View className={`rounded-full border px-2.5 py-1 ${statusClasses[status] ?? statusClasses.PENDING}`}>
      <Text className={`font-sans text-xs font-semibold ${statusClasses[status]?.split(" ").find((value) => value.startsWith("text-")) ?? "text-text-muted"}`}>
        {label}
      </Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[28%] flex-1 rounded-lg bg-background-muted p-3">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <Text className="mt-1 font-sans text-sm font-semibold text-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MoneyFact({ currencyCode, label, locale, value }: { currencyCode: string; label: string; locale: string; value: number }) {
  return (
    <View className="min-w-[45%] flex-1">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="mt-1 text-sm font-semibold" />
    </View>
  );
}

function validatePlanningForm(form: PlanningFormState) {
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
}
