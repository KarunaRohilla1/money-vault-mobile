import type { FinancialCycleApi, PlanningApiResponse, PlanningItemApi, PlanningStatusPayloadApi } from "@/services/api/types";

export type PlanningActivityKind = "income" | "commitment";
export type CloseAction = "Paid" | "Cancelled" | "Carry Forward" | null;

export interface PlanningActivityViewModel {
  actualAmount: number;
  accountId: number | null;
  accountName: string | null;
  completeLabel: string;
  completeStatus: "RECEIVED" | "PAID";
  dueDay: number;
  expectedAmount: number;
  icon: string;
  id: number;
  kind: PlanningActivityKind;
  name: string;
  status: string;
  statusLabel: string;
}

export interface CloseReviewItem {
  action: CloseAction;
  activity: PlanningActivityViewModel;
  amount: string;
}

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
  const income = planning.incomeTemplates.map((item) => buildActivity(item, "income"));
  const commitments = planning.commitments.map((item) => buildActivity(item, "commitment"));

  return [...income, ...commitments].sort((left, right) => left.dueDay - right.dueDay);
}

export function pendingCloseActivities(activities: PlanningActivityViewModel[]) {
  return activities.filter((activity) => activity.status === "PENDING" || activity.status === "CARRIED_FORWARD");
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

function buildActivity(item: PlanningItemApi, kind: PlanningActivityKind): PlanningActivityViewModel {
  const completeStatus = kind === "income" ? "RECEIVED" : "PAID";

  return {
    actualAmount: actualActivityAmount(item, completeStatus),
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
    status: item.status.status,
    statusLabel: statusLabel(item.status.status, kind)
  };
}
