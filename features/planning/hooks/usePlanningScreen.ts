import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAccountsQuery } from "@/features/accounts/api";
import {
  useCloseActiveCycleMutation,
  useCreateCommitmentMutation,
  useCreateIncomeTemplateMutation,
  useDeleteCommitmentMutation,
  useDeleteIncomeTemplateMutation,
  usePlanningCyclesQuery,
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
  statusPayloadForActivity,
  upcomingActivities,
  validateCloseReview,
  validatePlanningForm,
  type CloseReviewItem,
  type PlanningActivityKind,
  type PlanningActivityViewModel,
  type PlanningFormState
} from "@/features/planning/planningModel";
import { todayLocalIso } from "@/lib/date";
import type { PlanningItemApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

type ActivityDraftStatus = "COMPLETE" | "PENDING" | "CANCELLED";

function draftStatusForActivity(activity: PlanningActivityViewModel): ActivityDraftStatus {
  if (activity.status === activity.completeStatus) {
    return "COMPLETE";
  }

  if (activity.status === "CANCELLED") {
    return "CANCELLED";
  }

  return "PENDING";
}

export function usePlanningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cycleStart?: string; openReview?: string }>();
  const selectedCycleParam = typeof params.cycleStart === "string" ? params.cycleStart : undefined;
  const shouldOpenReview = params.openReview === "1" || params.openReview === "true";
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const currencyCode = useSettingsStore((state) => state.currencyCode);
  const locale = useSettingsStore((state) => state.locale);
  const [cyclePickerVisible, setCyclePickerVisible] = useState(false);
  const [cyclePickerYear, setCyclePickerYear] = useState(new Date().getFullYear());
  const [cycleStatusFilter, setCycleStatusFilter] = useState<"all" | "completed" | "current" | "upcoming">("all");
  const planningQuery = usePlanningQuery(token, vaultId, selectedCycleParam);
  const cyclePickerQuery = usePlanningCyclesQuery(token, vaultId, cyclePickerYear, cycleStatusFilter, cyclePickerVisible);
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
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [recurringVisible, setRecurringVisible] = useState(false);
  const [itemActionsVisible, setItemActionsVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<PlanningActivityViewModel | null>(null);
  const [activityDraftStatus, setActivityDraftStatus] = useState<ActivityDraftStatus>("PENDING");
  const [actualAmount, setActualAmount] = useState("");
  const [actualPaymentDate, setActualPaymentDate] = useState(todayLocalIso());
  const [actualNotes, setActualNotes] = useState("");
  const [actualError, setActualError] = useState<string | null>(null);
  const [closeVisible, setCloseVisible] = useState(false);
  const [closeItems, setCloseItems] = useState<CloseReviewItem[]>([]);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [savingClose, setSavingClose] = useState(false);
  const planning = planningQuery.data;
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
  const cycleOptions = cyclePickerQuery.data?.cycles ?? planning?.cycleNavigation?.cycles ?? [];
  const selectedCycleStart = planning?.cycle.startDate ?? selectedCycleParam ?? null;
  const canSelectPreviousCycle = Boolean(planning?.cycle.previousCycleStart);
  const canSelectNextCycle = Boolean(planning?.cycle.nextCycleStart);
  const pendingActivities = pendingCloseActivities(activities);
  const recurringSummary = planning ? recurringPlanSummary(planning) : null;
  const closeCardVisible = planning?.closeReadiness ? planning.closeReadiness.canClose : false;
  const formError = useMemo(() => validatePlanningForm(form), [form]);
  const visibleFormError = formSubmitted ? formError : null;
  const isSaving = createIncome.isPending || updateIncome.isPending || createCommitment.isPending || updateCommitment.isPending;
  const statusSaving = setIncomeStatus.isPending || setCommitmentStatus.isPending;
  const refreshing = planningQuery.isRefetching || accountsQuery.isRefetching;

  function refresh() {
    void planningQuery.refetch();
    void accountsQuery.refetch();
  }

  function selectCycle(cycleStart: string) {
    router.setParams({ cycleStart });
    setCyclePickerVisible(false);
  }

  function openCyclePicker() {
    if (planning?.cycle.startYear) {
      setCyclePickerYear(planning.cycle.startYear);
    }
    setCyclePickerVisible(true);
  }

  function selectPreviousCycle() {
    if (planning?.cycle.previousCycleStart) {
      selectCycle(planning.cycle.previousCycleStart);
    }
  }

  function selectNextCycle() {
    if (planning?.cycle.nextCycleStart) {
      selectCycle(planning.cycle.nextCycleStart);
    }
  }

  function goToCurrentCycle() {
    const currentCycleStart = cyclePickerQuery.data?.currentCycleStart ?? planning?.cycleNavigation?.currentCycleStart;
    if (currentCycleStart) {
      selectCycle(currentCycleStart);
    }
  }

  function openAddForm(kind: PlanningActivityKind) {
    setForm({ ...EMPTY_PLANNING_FORM, kind });
    setFormSubmitted(false);
    setFormVisible(true);
  }

  function closeForm() {
    setForm(EMPTY_PLANNING_FORM);
    setFormSubmitted(false);
    setFormVisible(false);
  }

  function submitForm() {
    setFormSubmitted(true);
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
    setFormSubmitted(false);
    setFormVisible(true);
  }

  function completeActivity(activity: PlanningActivityViewModel) {
    setSelectedActivity(activity);
    setActivityDraftStatus(draftStatusForActivity(activity));
    setActualAmount(String(activity.actualAmount));
    setActualPaymentDate(activity.paidDate || todayLocalIso());
    setActualNotes(activity.notes ?? "");
    setActualError(null);
    setItemActionsVisible(true);
  }

  function saveActivityActual() {
    if (!planning || !selectedActivity) {
      return;
    }

    if (activityDraftStatus !== "COMPLETE") {
      const status = activityDraftStatus === "CANCELLED" ? "CANCELLED" : "PENDING";
      const payload = statusPayloadForActivity(selectedActivity, planning.cycle, status, status === "CANCELLED" ? 0 : null, null);

      if (selectedActivity.kind === "income") {
        setIncomeStatus.mutate({ body: payload, templateId: selectedActivity.id }, { onSuccess: closeActivityActions });
        return;
      }

      setCommitmentStatus.mutate({ body: payload, commitmentId: selectedActivity.id }, { onSuccess: closeActivityActions });
      return;
    }

    const amount = Number(actualAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActualError("Actual amount must be greater than zero.");
      return;
    }

    const payload = {
      ...statusPayloadForActivity(selectedActivity, planning.cycle, selectedActivity.completeStatus, amount, actualPaymentDate),
      notes: actualNotes.trim()
    };

    if (selectedActivity.kind === "income") {
      setIncomeStatus.mutate({ body: payload, templateId: selectedActivity.id }, { onSuccess: closeActivityActions });
      return;
    }

    setCommitmentStatus.mutate({ body: payload, commitmentId: selectedActivity.id }, { onSuccess: closeActivityActions });
  }

  function setActivityStatus(activity: PlanningActivityViewModel, status: "CANCELLED" | "PENDING") {
    if (!planning) {
      return;
    }

    const payload = statusPayloadForActivity(activity, planning.cycle, status, status === "CANCELLED" ? 0 : null, null);
    if (activity.kind === "income") {
      setIncomeStatus.mutate({ body: payload, templateId: activity.id });
      return;
    }

    setCommitmentStatus.mutate({ body: payload, commitmentId: activity.id });
  }

  function openActivityActions(activity: PlanningActivityViewModel) {
    setSelectedActivity(activity);
    setActivityDraftStatus(draftStatusForActivity(activity));
    setActualAmount(String(activity.actualAmount));
    setActualPaymentDate(activity.paidDate || todayLocalIso());
    setActualNotes(activity.notes ?? "");
    setActualError(null);
    setItemActionsVisible(true);
  }

  function closeActivityActions() {
    setSelectedActivity(null);
    setItemActionsVisible(false);
    setActivityDraftStatus("PENDING");
    setActualPaymentDate(todayLocalIso());
    setActualError(null);
  }

  function openCloseReview() {
    setCloseItems(buildCloseReviewItems(activities));
    setCloseError(null);
    setCloseVisible(true);
  }

  useEffect(() => {
    if (!shouldOpenReview || !planning) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCloseItems(buildCloseReviewItems(activities));
    setCloseError(null);
    setCloseVisible(true);
    router.setParams({ openReview: undefined });
  }, [activities, planning, router, shouldOpenReview]);

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
      await closeCycle.mutateAsync({ body: closeReviewPayload(closeItems), cycleStart: planning.cycle.startDate });
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
    actualAmount,
    actualError,
    actualNotes,
    actualPaymentDate,
    activityDraftStatus,
    accountsQuery,
    activities,
    attentionActivities,
    closeCardVisible,
    closeCycle,
    closeError,
    closeForm,
    closeItems,
    closeVisible,
    cycleOptions,
    cyclePickerQuery,
    cyclePickerVisible,
    cyclePickerYear,
    cycleStatusFilter,
    completeActivity,
    currencyCode,
    deleteCommitment,
    deleteIncome,
    editItem,
    form,
    formError: visibleFormError,
    formVisible,
    isSaving,
    itemActionsVisible,
    locale,
    openActivityActions,
    openAddForm,
    openCloseReview,
    openCyclePicker,
    pendingActivities,
    canSelectNextCycle,
    canSelectPreviousCycle,
    planning,
    planningQuery,
    recurringSummary,
    recurringVisible,
    refresh,
    refreshing,
    selectedActivity,
    selectedCycleStart,
    selectCycle,
    selectNextCycle,
    selectPreviousCycle,
    goToCurrentCycle,
    saveActivityActual,
    setActivityStatus,
    setActualAmount,
    setActualNotes,
    setActualPaymentDate,
    setActivityDraftStatus,
    setCloseItems,
    setCloseVisible,
    setCyclePickerYear,
    setCycleStatusFilter,
    setCyclePickerVisible,
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
