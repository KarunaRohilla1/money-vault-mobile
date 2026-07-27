import { formatCurrency } from "@/lib/format";
import type { PlanningCycleApi, PlanningTotalsApi } from "@/services/api/types";

import type { PlanningActivityViewModel } from "./planningModel";

export type ActivityPresentationStatus = "pending" | "completed" | "skipped" | "carriedForward";
export type ActivityUrgency = "overdue" | "today" | "thisWeek" | "later" | "none";
export type ActivityStatusFilter = "pending" | "completed" | "skipped" | "all";
export type ActivityTypeFilter = "all" | "income" | "commitment" | "bill";
export type ActivityGroupMode = "dueDate" | "type" | "status" | "account" | "none";
export type ActivitySortMode = "dueSoonest" | "dueLatest" | "amountHighest" | "amountLowest" | "nameAsc" | "nameDesc";
export type ActivityPresentationType = "income" | "commitment" | "bill";

export interface PresentedPlanningActivity extends PlanningActivityViewModel {
  dueDate: string;
  dueLabel: string;
  effectiveAmount: number;
  presentationStatus: ActivityPresentationStatus;
  presentationType: ActivityPresentationType;
  typeLabel: string;
  urgency: ActivityUrgency;
}

export interface ActivityGroup {
  key: string;
  label: string;
  tone: "danger" | "warning" | "success" | "neutral";
  activities: PresentedPlanningActivity[];
}

export interface ActivityMetrics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  skipped: number;
  remaining: number;
}

const billNamePattern = /bill|electric|power|utility|water|gas|internet|wifi|phone|mobile|card|credit|insurance|medical|health/i;

export const statusFilterLabels: Record<ActivityStatusFilter, string> = {
  all: "All",
  completed: "Completed",
  pending: "Pending",
  skipped: "Skipped"
};

export const typeFilterLabels: Record<ActivityTypeFilter, string> = {
  all: "All",
  bill: "Bills",
  commitment: "Commitments",
  income: "Income"
};

export const groupModeLabels: Record<ActivityGroupMode, string> = {
  account: "Account",
  dueDate: "Due Date",
  none: "None",
  status: "Status",
  type: "Type"
};

export const sortModeLabels: Record<ActivitySortMode, string> = {
  amountHighest: "Amount (Highest)",
  amountLowest: "Amount (Lowest)",
  dueLatest: "Due Date (Latest)",
  dueSoonest: "Due Date (Soonest)",
  nameAsc: "Name (A-Z)",
  nameDesc: "Name (Z-A)"
};

export function getActivityPresentationStatus(activity: PlanningActivityViewModel): ActivityPresentationStatus {
  if (activity.status === activity.completeStatus || activity.status === "RECEIVED" || activity.status === "PAID") {
    return "completed";
  }

  if (activity.status === "CANCELLED") {
    return "skipped";
  }

  if (activity.status === "CARRIED_FORWARD") {
    return "carriedForward";
  }

  return "pending";
}

export function activityDueDate(activity: PlanningActivityViewModel, cycle: Pick<PlanningCycleApi, "startMonth" | "startYear">) {
  if (activity.dueDate) {
    return activity.dueDate;
  }

  return `${cycle.startYear}-${String(cycle.startMonth).padStart(2, "0")}-${String(activity.dueDay).padStart(2, "0")}`;
}

export function isBillActivity(activity: PlanningActivityViewModel) {
  return activity.kind === "commitment" && (billNamePattern.test(activity.name) || ["lightning-bolt-outline", "credit-card-outline", "wifi", "shield-check-outline"].includes(activity.icon));
}

export function getActivityPresentationType(activity: PlanningActivityViewModel): ActivityPresentationType {
  if (activity.kind === "income") {
    return "income";
  }

  return isBillActivity(activity) ? "bill" : "commitment";
}

export function getActivityTypeLabel(activity: PlanningActivityViewModel) {
  const type = getActivityPresentationType(activity);
  if (type === "income") {
    return "Income";
  }
  if (type === "bill") {
    return "Bill";
  }
  return "Commitment";
}

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseLocalIso(value: string) {
  const [yearText, monthText, dayText] = value.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
}

function dayDiff(left: Date, right: Date) {
  return Math.round((dateOnly(left).getTime() - dateOnly(right).getTime()) / 86400000);
}

export function getActivityUrgency(activity: PlanningActivityViewModel, cycle: Pick<PlanningCycleApi, "status">, dueDate: string, today = new Date()): ActivityUrgency {
  const status = getActivityPresentationStatus(activity);
  if (status === "completed" || status === "skipped") {
    return "none";
  }

  const diff = dayDiff(parseLocalIso(dueDate), today);
  if (cycle.status !== "Current") {
    return diff <= 7 ? "thisWeek" : "later";
  }

  if (diff < 0) {
    return "overdue";
  }
  if (diff === 0) {
    return "today";
  }
  if (diff <= 7) {
    return "thisWeek";
  }
  return "later";
}

export function getActivityDueLabel(activity: PlanningActivityViewModel, cycle: Pick<PlanningCycleApi, "status">, dueDate: string, today = new Date()) {
  const status = getActivityPresentationStatus(activity);
  if (status === "completed") {
    return activity.kind === "income" ? "Received" : "Paid";
  }
  if (status === "skipped") {
    return "Skipped";
  }
  if (status === "carriedForward") {
    return "Carried forward";
  }

  const due = parseLocalIso(dueDate);
  const diff = dayDiff(due, today);
  const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(due);

  if (cycle.status === "Upcoming") {
    return `Due on ${shortDate}`;
  }
  if (cycle.status !== "Current") {
    return `Due ${shortDate}`;
  }
  if (diff < 0) {
    return "Overdue";
  }
  if (diff === 0) {
    return "Due today";
  }
  if (diff === 1) {
    return "Due tomorrow";
  }
  if (diff <= 7) {
    return `Due in ${diff} days`;
  }
  return `Due on ${shortDate}`;
}

export function presentActivities(activities: PlanningActivityViewModel[], cycle: PlanningCycleApi, today = new Date()): PresentedPlanningActivity[] {
  return activities.map((activity) => {
    const dueDate = activityDueDate(activity, cycle);
    return {
      ...activity,
      dueDate,
      dueLabel: getActivityDueLabel(activity, cycle, dueDate, today),
      effectiveAmount: activity.expectedAmount,
      presentationStatus: getActivityPresentationStatus(activity),
      presentationType: getActivityPresentationType(activity),
      typeLabel: getActivityTypeLabel(activity),
      urgency: getActivityUrgency(activity, cycle, dueDate, today)
    };
  });
}

export function getActivityMetrics(activities: PresentedPlanningActivity[], totals?: Pick<PlanningTotalsApi, "remainingCommitments">): ActivityMetrics {
  return {
    completed: activities.filter((activity) => activity.presentationStatus === "completed").length,
    overdue: activities.filter((activity) => activity.urgency === "overdue").length,
    pending: activities.filter((activity) => (activity.presentationStatus === "pending" || activity.presentationStatus === "carriedForward") && activity.urgency !== "overdue").length,
    remaining: totals?.remainingCommitments ?? activities.filter((activity) => activity.presentationStatus === "pending" || activity.presentationStatus === "carriedForward").reduce((sum, activity) => sum + activity.effectiveAmount, 0),
    skipped: activities.filter((activity) => activity.presentationStatus === "skipped").length,
    total: activities.length
  };
}

export function statusCounts(activities: PresentedPlanningActivity[]) {
  const completed = activities.filter((activity) => activity.presentationStatus === "completed").length;
  const skipped = activities.filter((activity) => activity.presentationStatus === "skipped").length;
  const pending = activities.filter((activity) => activity.presentationStatus === "pending" || activity.presentationStatus === "carriedForward").length;

  return { all: activities.length, completed, pending, skipped } satisfies Record<ActivityStatusFilter, number>;
}

export function filterActivities(activities: PresentedPlanningActivity[], statusFilter: ActivityStatusFilter, typeFilter: ActivityTypeFilter) {
  return activities.filter((activity) => {
    const statusMatches = statusFilter === "all"
      || (statusFilter === "pending" && (activity.presentationStatus === "pending" || activity.presentationStatus === "carriedForward"))
      || activity.presentationStatus === statusFilter;
    const typeMatches = typeFilter === "all" || activity.presentationType === typeFilter || (typeFilter === "commitment" && activity.kind === "commitment" && activity.presentationType !== "bill");

    return statusMatches && typeMatches;
  });
}

export function sortActivities(activities: PresentedPlanningActivity[], sortMode: ActivitySortMode) {
  return [...activities].sort((left, right) => {
    if (sortMode === "dueLatest") {
      return right.dueDate.localeCompare(left.dueDate) || left.name.localeCompare(right.name);
    }
    if (sortMode === "amountHighest") {
      return right.effectiveAmount - left.effectiveAmount || left.name.localeCompare(right.name);
    }
    if (sortMode === "amountLowest") {
      return left.effectiveAmount - right.effectiveAmount || left.name.localeCompare(right.name);
    }
    if (sortMode === "nameAsc") {
      return left.name.localeCompare(right.name);
    }
    if (sortMode === "nameDesc") {
      return right.name.localeCompare(left.name);
    }
    return left.dueDate.localeCompare(right.dueDate) || left.name.localeCompare(right.name);
  });
}

function groupTone(key: string): ActivityGroup["tone"] {
  if (key === "overdue") {
    return "danger";
  }
  if (key === "today" || key === "thisWeek") {
    return "warning";
  }
  if (key === "later") {
    return "success";
  }
  return "neutral";
}

function dueGroupKey(activity: PresentedPlanningActivity, cycle: Pick<PlanningCycleApi, "status">) {
  if (cycle.status !== "Current" && (activity.presentationStatus === "completed" || activity.presentationStatus === "skipped")) {
    return activity.presentationStatus;
  }
  if (activity.urgency === "overdue" || activity.urgency === "today" || activity.urgency === "thisWeek") {
    return activity.urgency;
  }
  return "later";
}

function groupLabel(key: string, mode: ActivityGroupMode) {
  if (mode === "dueDate") {
    const labels: Record<string, string> = {
      completed: "COMPLETED",
      later: "LATER",
      overdue: "OVERDUE",
      skipped: "SKIPPED",
      thisWeek: "DUE THIS WEEK",
      today: "DUE TODAY"
    };
    return labels[key] ?? key.toUpperCase();
  }
  if (mode === "type") {
    return key.toUpperCase();
  }
  if (mode === "status") {
    return key === "carriedForward" ? "CARRIED FORWARD" : key.toUpperCase();
  }
  if (mode === "account") {
    return key.toUpperCase();
  }
  return "ACTIVITIES";
}

export function groupActivities(activities: PresentedPlanningActivity[], groupMode: ActivityGroupMode, cycle: Pick<PlanningCycleApi, "status">): ActivityGroup[] {
  if (groupMode === "none") {
    return activities.length ? [{ activities, key: "all", label: "ACTIVITIES", tone: "neutral" }] : [];
  }

  const grouped = new Map<string, PresentedPlanningActivity[]>();
  for (const activity of activities) {
    const key = groupMode === "dueDate"
      ? dueGroupKey(activity, cycle)
      : groupMode === "type"
        ? activity.typeLabel
        : groupMode === "status"
          ? activity.presentationStatus
          : activity.accountName ?? "No account";
    grouped.set(key, [...(grouped.get(key) ?? []), activity]);
  }

  const dueOrder = ["overdue", "today", "thisWeek", "later", "completed", "skipped"];
  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (groupMode === "dueDate") {
        return dueOrder.indexOf(left) - dueOrder.indexOf(right);
      }
      return left.localeCompare(right);
    })
    .map(([key, groupActivities]) => ({
      activities: groupActivities,
      key,
      label: `${groupLabel(key, groupMode)} (${groupActivities.length})`,
      tone: groupMode === "dueDate" ? groupTone(key) : "neutral"
    }));
}


export function compactInsightLine(metrics: Pick<ActivityMetrics, "overdue" | "pending" | "remaining">, currencyCode: string, locale = "en-IN") {
  const fragments: string[] = [];

  if (metrics.overdue > 0) {
    fragments.push(pluralize(metrics.overdue, "overdue", "overdue"));
  } else if (metrics.pending > 0) {
    fragments.push("No overdue");
  }

  if (metrics.pending > 0) {
    fragments.push(pluralize(metrics.pending, "pending", "pending"));
  }

  if (metrics.remaining > 0) {
    fragments.push(`${formatCurrency(metrics.remaining, currencyCode, locale)} remaining`);
  }

  return fragments.length > 0 ? fragments.join(" - ") : "All activities completed";
}

export function activeFilterCount(statusFilter: ActivityStatusFilter, typeFilter: ActivityTypeFilter) {
  return (statusFilter === "skipped" ? 1 : 0) + (typeFilter === "all" ? 0 : 1);
}

export function typeFilterButtonLabel(typeFilter: ActivityTypeFilter) {
  return typeFilter === "all" ? "All types" : typeFilterLabels[typeFilter];
}

export function viewOptionsSummary(groupMode: ActivityGroupMode, sortMode: ActivitySortMode) {
  const sortSummary: Record<ActivitySortMode, string> = {
    amountHighest: "Highest amount",
    amountLowest: "Lowest amount",
    dueLatest: "Latest first",
    dueSoonest: "Soonest first",
    nameAsc: "A-Z",
    nameDesc: "Z-A"
  };

  return `Grouped by ${groupModeLabels[groupMode].toLowerCase()} - ${sortSummary[sortMode]}`;
}

export function emptyStateFor(statusFilter: ActivityStatusFilter, typeFilter: ActivityTypeFilter) {
  if (statusFilter === "pending") {
    return { message: "Everything in this cycle is resolved.", title: "No pending activities" };
  }
  if (statusFilter === "completed") {
    return { message: "Completed items will appear here.", title: "No completed activities" };
  }
  if (statusFilter === "skipped") {
    return { message: "Skipped items will appear here.", title: "No skipped activities" };
  }
  if (statusFilter === "all" && typeFilter === "all") {
    return { message: "Try changing your filters.", title: "No matching activities" };
  }
  if (typeFilter === "income") {
    return { message: "There are no income items in this cycle.", title: "No income activities" };
  }
  if (typeFilter === "bill") {
    return { message: "No bill-like commitments were found in this cycle.", title: "No bill activities" };
  }
  return { message: "Try changing your filters.", title: "No matching activities" };
}

export function pluralize(count: number, singular: string, plural?: string) {
  const pluralLabel = plural ?? (singular.endsWith("y") ? `${singular.slice(0, -1)}ies` : `${singular}s`);
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

export function activityAccessibilityLabel(activity: PresentedPlanningActivity, currencyCode: string, locale = "en-IN") {
  return `${activity.name}, ${activity.typeLabel.toLowerCase()}, ${activity.dueLabel.toLowerCase()}, ${formatCurrency(activity.effectiveAmount, currencyCode, locale)}`;
}
