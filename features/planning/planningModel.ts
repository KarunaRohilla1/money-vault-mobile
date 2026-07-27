import type { FinancialCycleApi, PlanningActivityApi, PlanningApiResponse, PlanningItemApi, PlanningStatusPayloadApi } from "@/services/api/types";

export type PlanningActivityKind = "income" | "commitment";
export type CloseAction = "Paid" | "Cancelled" | "Carry Forward" | null;

export interface PlanningActivityViewModel {
  actualAmount: number;
  actualEntered: boolean;
  accountId: number | null;
  accountName: string | null;
  completeLabel: string;
  completeStatus: "RECEIVED" | "PAID";
  dueDate?: string;
  dueDay: number;
  expectedAmount: number;
  icon: string;
  id: number;
  kind: PlanningActivityKind;
  name: string;
  notes: string | null;
  status: string;
  statusLabel: string;
  timelineLabel?: string;
}

export interface CloseReviewItem {
  action: CloseAction;
  activity: PlanningActivityViewModel;
  amount: string;
}

export interface PlanningFormState {
  accountId: number | null;
  amount: string;
  dueDay: string;
  id: number | null;
  kind: PlanningActivityKind;
  name: string;
}

export const EMPTY_PLANNING_FORM: PlanningFormState = {
  accountId: null,
  amount: "",
  dueDay: "1",
  id: null,
  kind: "commitment",
  name: ""
};

const incomeIcon = "$";

const commitmentIconRules: [RegExp, string][] = [
  [/rent|mortgage|home|house/i, "home-outline"],
  [/electric|power|utility|water|gas/i, "lightning-bolt-outline"],
  [/card|credit/i, "credit-card-outline"],
  [/loan|emi|debt/i, "bank-outline"],
  [/internet|wifi|phone|mobile/i, "wifi"],
  [/insurance|medical|health/i, "shield-check-outline"],
  [/school|tuition|education/i, "school-outline"],
  [/subscription|netflix|spotify|prime/i, "refresh"]
];

export function commitmentIconName(name: string) {
  return commitmentIconRules.find(([pattern]) => pattern.test(name))?.[1] ?? "calendar-check-outline";
}

export function statusLabel(status: string, kind: PlanningActivityKind) {
  if (kind === "income" && status === "RECEIVED") {
    return "Received";
  }

  if (kind === "commitment" && status === "PAID") {
    return "Paid";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  if (status === "CARRIED_FORWARD") {
    return "Carried";
  }

  return "Pending";
}

export function effectiveExpectedAmount(item: PlanningItemApi) {
  if (item.status.actualAmount !== null && item.status.actualAmount !== undefined && item.status.status !== "CANCELLED") {
    return item.status.actualAmount;
  }

  return item.amount;
}

export function actualActivityAmount(item: PlanningItemApi, completeStatus: "RECEIVED" | "PAID") {
  const expected = effectiveExpectedAmount(item);
  return item.status.status === completeStatus && item.status.actualAmount !== null && item.status.actualAmount !== undefined ? item.status.actualAmount : expected;
}

export function buildPlanningActivities(planning: PlanningApiResponse): PlanningActivityViewModel[] {
  if (planning.activities?.length) {
    return planning.activities.map((item) => buildBackendActivity(item));
  }

  const income = planning.incomeTemplates.map((item) => buildActivity(item, "income"));
  const commitments = planning.commitments.map((item) => buildActivity(item, "commitment"));

  return [...income, ...commitments].sort((left, right) => left.dueDay - right.dueDay);
}

export function pendingCloseActivities(activities: PlanningActivityViewModel[]) {
  return activities.filter((activity) => activity.status === "PENDING" || activity.status === "CARRIED_FORWARD");
}

export function unresolvedPlanningActivities(activities: PlanningActivityViewModel[]) {
  return activities.filter((activity) => activity.status === "PENDING" || activity.status === "CARRIED_FORWARD");
}

export function urgencyRank(activity: PlanningActivityViewModel, cycle: Pick<PlanningApiResponse["cycle"], "startMonth" | "startYear">, today = new Date()) {
  const dueDate = new Date(cycle.startYear, cycle.startMonth - 1, activity.dueDay);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((dueDate.getTime() - todayStart.getTime()) / 86400000);

  if (diffDays < 0) {
    return -1000 + diffDays;
  }

  if (diffDays <= 3) {
    return diffDays;
  }

  return 100 + diffDays;
}

export function needsAttentionActivities(activities: PlanningActivityViewModel[], cycle: Pick<PlanningApiResponse["cycle"], "startMonth" | "startYear">, today = new Date()) {
  return unresolvedPlanningActivities(activities)
    .filter((activity) => urgencyRank(activity, cycle, today) <= 3)
    .sort((left, right) => urgencyRank(left, cycle, today) - urgencyRank(right, cycle, today) || left.dueDay - right.dueDay);
}

export function upcomingActivities(
  activities: PlanningActivityViewModel[],
  cycle: Pick<PlanningApiResponse["cycle"], "startMonth" | "startYear">,
  attention: PlanningActivityViewModel[],
  limit = 5,
  today = new Date()
) {
  const attentionKeys = new Set(attention.map((activity) => `${activity.kind}:${activity.id}`));

  return unresolvedPlanningActivities(activities)
    .filter((activity) => !attentionKeys.has(`${activity.kind}:${activity.id}`))
    .sort((left, right) => urgencyRank(left, cycle, today) - urgencyRank(right, cycle, today) || left.dueDay - right.dueDay)
    .slice(0, limit);
}


export function planningTimelineActivities(planning: PlanningApiResponse, fallback: PlanningActivityViewModel[]) {
  if (planning.timeline?.length) {
    return planning.timeline.map((item) => buildBackendActivity(item));
  }

  return fallback;
}

export function closeReviewPayload(items: CloseReviewItem[]) {
  return {
    items: items
      .filter((item) => item.action !== null)
      .map((item) => ({
        action: item.action as Exclude<CloseAction, null>,
        amount: item.action === "Cancelled" ? 0 : Number(item.amount),
        id: item.activity.id,
        type: item.activity.kind
      }))
  };
}
export function recurringPlanSummary(planning: Pick<PlanningApiResponse, "commitments" | "incomeTemplates">) {
  return {
    commitmentCount: planning.commitments.length,
    commitmentTotal: planning.commitments.reduce((total, item) => total + item.amount, 0),
    incomeCount: planning.incomeTemplates.length,
    incomeTotal: planning.incomeTemplates.reduce((total, item) => total + item.amount, 0)
  };
}

export function shouldShowCloseCycleCard(
  cycle: PlanningApiResponse["cycle"],
  dashboardCycle: Partial<Pick<FinancialCycleApi, "daysRemaining">> | null | undefined,
  unresolvedCount: number
) {
  if (cycle.status !== "Current") {
    return false;
  }

  return unresolvedCount === 0 || (dashboardCycle?.daysRemaining ?? 99) <= 5;
}

export function buildCloseReviewItems(activities: PlanningActivityViewModel[]): CloseReviewItem[] {
  return pendingCloseActivities(activities).map((activity) => ({
    action: null,
    activity,
    amount: String(activity.expectedAmount)
  }));
}

export function validateCloseReview(items: CloseReviewItem[]) {
  if (items.some((item) => item.action === null)) {
    return "Please choose an action for every pending item.";
  }

  if (
    items.some((item) => {
      const amount = Number(item.amount);
      return (item.action === "Paid" || item.action === "Carry Forward") && (!Number.isFinite(amount) || amount <= 0);
    })
  ) {
    return "Paid and carried items must have an amount greater than zero.";
  }

  return null;
}

export function closeActionStatus(action: Exclude<CloseAction, null>, kind: PlanningActivityKind) {
  if (action === "Paid") {
    return kind === "income" ? "RECEIVED" : "PAID";
  }

  if (action === "Cancelled") {
    return "CANCELLED";
  }

  return "CARRIED_FORWARD";
}

export function statusPayloadForActivity(activity: PlanningActivityViewModel, cycle: PlanningApiResponse["cycle"], status: string, amount: number | null): PlanningStatusPayloadApi {
  return {
    actualAmount: amount,
    month: cycle.startMonth,
    status,
    year: cycle.startYear
  };
}

export function validatePlanningForm(form: PlanningFormState) {
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

type CycleProgressFields = Pick<FinancialCycleApi, "daysCompleted" | "progressPercent" | "totalDays"> & Partial<Pick<FinancialCycleApi, "daysRemaining">>;

export function cycleProgressPercent(cycle?: CycleProgressFields | null) {
  return Math.min(100, Math.max(0, cycle?.progressPercent ?? 0));
}

export function cycleCompletionLabel(cycle?: CycleProgressFields | null) {
  if (!cycle) {
    return "0/0 days";
  }

  return `${cycle.daysCompleted}/${cycle.totalDays} days`;
}

export function daysRemainingLabel(cycle?: CycleProgressFields | null) {
  return `${cycle?.daysRemaining ?? 0} days`;
}

export function upcomingTimelineLabel(activity: PlanningActivityViewModel, cycle: Pick<PlanningApiResponse["cycle"], "startMonth" | "startYear">) {
  const dueDate = new Date(cycle.startYear, cycle.startMonth - 1, activity.dueDay);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((dueDate.getTime() - todayStart.getTime()) / 86400000);

  if (diffDays < 0 && activity.status === "PENDING") {
    return "Overdue";
  }

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }

  if (diffDays > 1) {
    return `In ${diffDays} days`;
  }

  return `Due day ${activity.dueDay}`;
}


function buildBackendActivity(item: PlanningActivityApi): PlanningActivityViewModel {
  return {
    actualAmount: item.status.actualAmount ?? item.actualAmount,
    actualEntered: item.status.actualAmount !== null && item.status.actualAmount !== undefined,
    accountId: item.accountId ?? null,
    accountName: item.accountName ?? null,
    completeLabel: item.completeLabel,
    completeStatus: item.completeStatus,
    dueDate: item.dueDate,
    dueDay: item.dueDay,
    expectedAmount: item.effectiveExpectedAmount,
    icon: item.icon,
    id: item.id,
    kind: item.kind,
    name: item.name,
    notes: item.status.notes ?? null,
    status: item.status.status,
    statusLabel: item.statusLabel,
    timelineLabel: item.timelineLabel
  };
}
function buildActivity(item: PlanningItemApi, kind: PlanningActivityKind): PlanningActivityViewModel {
  const completeStatus = kind === "income" ? "RECEIVED" : "PAID";

  return {
    actualAmount: item.status.actualAmount ?? actualActivityAmount(item, completeStatus),
    actualEntered: item.status.actualAmount !== null && item.status.actualAmount !== undefined,
    accountId: item.accountId ?? null,
    accountName: item.accountName ?? null,
    completeLabel: kind === "income" ? "Mark received" : "Mark paid",
    completeStatus,
    dueDay: item.dueDay,
    expectedAmount: effectiveExpectedAmount(item),
    icon: kind === "income" ? incomeIcon : commitmentIconName(item.name),
    id: item.id,
    kind,
    name: item.name,
    notes: item.status.notes ?? null,
    status: item.status.status,
    statusLabel: statusLabel(item.status.status, kind)
  };
}
