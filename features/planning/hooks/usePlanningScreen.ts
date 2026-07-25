import { useMemo, useState } from "react";

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
  closeReviewPayload,
  EMPTY_PLANNING_FORM,
  needsAttentionActivities,
  planningTimelineActivities,
  pendingCloseActivities,
  recurringPlanSummary,
  shouldShowCloseCycleCard,
  statusPayloadForActivity,
  upcomingActivities,
  validateCloseReview,
  validatePlanningForm,
  type CloseReviewItem,
  type PlanningActivityKind,
  type PlanningActivityViewModel,
  type PlanningFormState
} from "@/features/planning/planningModel";
import type { PlanningItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function usePlanningScreen() {
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
  const [form, setForm] = useState<PlanningFormState>(EMPTY_PLANNING_FORM);
  const [formVisible, setFormVisible] = useState(false);
  const [recurringVisible, setRecurringVisible] = useState(false);
  const [itemActionsVisible, setItemActionsVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<PlanningActivityViewModel | null>(null);
  const [closeVisible, setCloseVisible] = useState(false);
  const [closeItems, setCloseItems] = useState<CloseReviewItem[]>([]);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [savingClose, setSavingClose] = useState(false);
  const planning = planningQuery.data;
  const dashboardCycle = dashboardQuery.data?.cycle ?? null;
  const activities = useMemo(() => (planning ? buildPlanningActivities(planning) : []), [planning]);
  const attentionActivities = useMemo(
    () => (planning ? needsAttentionActivities(activities, planning.cycle) : []),
    [activities, planning]
  );
  const fallbackUpcoming = useMemo(
    () => (planning ? upcomingActivities(activities, planning.cycle, attentionActivities, 5) : []),
    [activities, attentionActivities, planning]
  );
  const upcoming = useMemo(() => (planning ? planningTimelineActivities(planning, fallbackUpcoming) : []), [fallbackUpcoming, planning]);
  const pendingActivities = pendingCloseActivities(activities);
  const recurringSummary = planning ? recurringPlanSummary(planning) : null;
  const closeCardVisible = planning?.closeReadiness ? planning.closeReadiness.canClose : planning ? shouldShowCloseCycleCard(planning.cycle, dashboardCycle, pendingActivities.length) : false;
  const statusPayload = planning ? { month: planning.cycle.startMonth, year: planning.cycle.startYear } : null;
  const formError = useMemo(() => validatePlanningForm(form), [form]);
  const isSaving = createIncome.isPending || updateIncome.isPending || createCommitment.isPending || updateCommitment.isPending;
  const statusSaving = setIncomeStatus.isPending || setCommitmentStatus.isPending;
  const refreshing = planningQuery.isRefetching || dashboardQuery.isRefetching || accountsQuery.isRefetching;

  function refresh() {
    void planningQuery.refetch();
    void dashboardQuery.refetch();
    void accountsQuery.refetch();
  }

  function openAddForm(kind: PlanningActivityKind) {
    setForm({ ...EMPTY_PLANNING_FORM, kind });
    setFormVisible(true);
  }

  function closeForm() {
    setForm(EMPTY_PLANNING_FORM);
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

  function editItem(item: PlanningItemApi, kind: PlanningActivityKind) {
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

  function setActivityStatus(activity: PlanningActivityViewModel, status: "CANCELLED" | "PENDING") {
    if (!planning) {
      return;
    }

    const payload = statusPayloadForActivity(activity, planning.cycle, status, status === "CANCELLED" ? 0 : null);
    if (activity.kind === "income") {
      setIncomeStatus.mutate({ body: payload, templateId: activity.id });
      return;
    }

    setCommitmentStatus.mutate({ body: payload, commitmentId: activity.id });
  }

  function openActivityActions(activity: PlanningActivityViewModel) {
    setSelectedActivity(activity);
    setItemActionsVisible(true);
  }

  function closeActivityActions() {
    setSelectedActivity(null);
    setItemActionsVisible(false);
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
      await closeCycle.mutateAsync(closeReviewPayload(closeItems));
      setCloseVisible(false);
      refresh();
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "Cycle could not be closed.");
    } finally {
      setSavingClose(false);
    }
  }

  return {
    accounts: accountsQuery.data ?? [],
    accountsQuery,
    activities,
    attentionActivities,
    closeCardVisible,
    closeCycle,
    closeError,
    closeForm,
    closeItems,
    closeVisible,
    completeActivity,
    currencyCode,
    dashboardCycle,
    dashboardQuery,
    deleteCommitment,
    deleteIncome,
    editItem,
    form,
    formError,
    formVisible,
    isSaving,
    itemActionsVisible,
    locale,
    openActivityActions,
    openAddForm,
    openCloseReview,
    pendingActivities,
    planning,
    planningQuery,
    recurringSummary,
    recurringVisible,
    refresh,
    refreshing,
    selectedActivity,
    setActivityStatus,
    setCloseItems,
    setCloseVisible,
    setForm,
    setFormVisible,
    setItemActionsVisible,
    setRecurringVisible,
    savingClose,
    statusSaving,
    submitCloseReview,
    submitForm,
    upcoming,
    closeActivityActions
  };
}

export type PlanningScreenState = ReturnType<typeof usePlanningScreen>;
