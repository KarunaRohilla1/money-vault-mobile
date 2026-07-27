import type { CloseAction, CloseReviewItem } from "@/features/planning/planningModel";

export interface CloseCycleSummaryBucket {
  amount: number;
  count: number;
}

export interface CloseCycleSummary {
  cancelled: CloseCycleSummaryBucket;
  carried: CloseCycleSummaryBucket;
  paidOrReceived: CloseCycleSummaryBucket;
  reviewed: number;
  total: number;
  remaining: number;
}

export type CloseCycleBulkAction = "markPaid" | "markReceived" | "carryForward" | "clear";

export function isAmountRequired(action: CloseAction) {
  return action === "Paid" || action === "Carry Forward";
}

export function isCloseItemInvalid(item: CloseReviewItem) {
  if (item.action === null) {
    return true;
  }

  if (!isAmountRequired(item.action)) {
    return false;
  }

  const amount = Number(item.amount);
  return !Number.isFinite(amount) || amount <= 0;
}

export function closeItemValidationMessage(item: CloseReviewItem) {
  if (item.action === null) {
    return "Choose an action.";
  }

  if (isCloseItemInvalid(item)) {
    return "Enter an amount greater than zero.";
  }

  return null;
}

export function closeCycleSummary(items: CloseReviewItem[]): CloseCycleSummary {
  const summary: CloseCycleSummary = {
    cancelled: { amount: 0, count: 0 },
    carried: { amount: 0, count: 0 },
    paidOrReceived: { amount: 0, count: 0 },
    remaining: 0,
    reviewed: 0,
    total: items.length
  };

  for (const item of items) {
    if (isCloseItemInvalid(item)) {
      summary.remaining += 1;
      continue;
    }

    summary.reviewed += 1;
    const amount = Number(item.amount) || 0;
    if (item.action === "Cancelled") {
      summary.cancelled.count += 1;
      summary.cancelled.amount += item.activity.expectedAmount;
    } else if (item.action === "Carry Forward") {
      summary.carried.count += 1;
      summary.carried.amount += amount;
    } else if (item.action === "Paid") {
      summary.paidOrReceived.count += 1;
      summary.paidOrReceived.amount += amount;
    }
  }

  return summary;
}

export function nextUnresolvedKey(items: CloseReviewItem[], currentIndex = -1) {
  const afterCurrent = items.findIndex((item, index) => index > currentIndex && isCloseItemInvalid(item));
  if (afterCurrent >= 0) {
    return closeItemKey(items[afterCurrent]!);
  }

  const first = items.find((item) => isCloseItemInvalid(item));
  return first ? closeItemKey(first) : null;
}

export function closeItemKey(item: CloseReviewItem) {
  return `${item.activity.kind}:${item.activity.id}`;
}

export function availableBulkActions(items: CloseReviewItem[]): CloseCycleBulkAction[] {
  if (items.length === 0) {
    return [];
  }

  const actions: CloseCycleBulkAction[] = [];
  if (items.some((item) => item.activity.kind === "commitment")) {
    actions.push("markPaid");
  }
  if (items.some((item) => item.activity.kind === "income")) {
    actions.push("markReceived");
  }
  actions.push("carryForward", "clear");
  return actions;
}

export function applyBulkAction(items: CloseReviewItem[], action: CloseCycleBulkAction): CloseReviewItem[] {
  if (action === "clear") {
    return items.map((item) => ({ ...item, action: null }));
  }

  return items.map((item) => {
    if (action === "markPaid" && item.activity.kind !== "commitment") {
      return item;
    }
    if (action === "markReceived" && item.activity.kind !== "income") {
      return item;
    }
    return {
      ...item,
      action: action === "carryForward" ? "Carry Forward" : "Paid"
    };
  });
}

export function closeCycleProgressLabel(summary: CloseCycleSummary) {
  return `${summary.reviewed} / ${summary.total}`;
}
