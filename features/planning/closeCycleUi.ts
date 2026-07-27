import { formatCurrency } from "@/lib/format";
import type { CloseAction, CloseReviewItem, PlanningActivityKind } from "@/features/planning/planningModel";
import { isAmountRequired } from "@/features/planning/closeCyclePresentation";

export interface CloseCycleActionOption {
  action: Exclude<CloseAction, null>;
  description: string;
  label: string;
  tone: "danger" | "success" | "warning";
}

export function closeCycleActionOptions(kind: PlanningActivityKind): CloseCycleActionOption[] {
  return [
    { action: "Paid", description: kind === "income" ? "Record income" : "Record payment", label: kind === "income" ? "Received" : "Paid", tone: "success" },
    { action: "Carry Forward", description: "Move to next cycle", label: "Carry Forward", tone: "warning" },
    { action: "Cancelled", description: kind === "income" ? "Ignore this income" : "Ignore this commitment", label: kind === "income" ? "Skipped" : "Cancelled", tone: "danger" }
  ];
}

export function closeCycleActionTitle(action: Exclude<CloseAction, null>, kind: PlanningActivityKind) {
  if (action === "Paid") return kind === "income" ? "Received" : "Paid";
  if (action === "Cancelled") return kind === "income" ? "Skipped" : "Cancelled";
  return "Carry Forward";
}

export function closeCycleAmountLabel(action: CloseAction, kind: PlanningActivityKind) {
  if (action === "Carry Forward") return "Carry-forward amount";
  if (action === "Paid") return kind === "income" ? "Actual (Received)" : "Actual (Paid)";
  return null;
}

export function shouldShowCloseCycleAmountField(action: CloseAction) {
  return isAmountRequired(action);
}

export function closeCycleValidationText(message: string | null) {
  if (message === "Choose an action.") {
    return "Select how this item should be resolved.";
  }
  return message;
}

export function closeCycleSelectedSummary(item: CloseReviewItem, currencyCode: string, locale: string) {
  if (!item.action) {
    return null;
  }

  const title = closeCycleActionTitle(item.action, item.activity.kind);
  if (!shouldShowCloseCycleAmountField(item.action)) {
    return `Selected: ${title}`;
  }

  return `Selected: ${title} - ${formatCurrency(Number(item.amount) || 0, currencyCode, locale)}`;
}

export function closeCycleItemCountLabel(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function formatCloseCycleCurrency(amount: number, currencyCode: string, locale: string) {
  return formatCurrency(amount, currencyCode as Parameters<typeof formatCurrency>[1], locale);
}
