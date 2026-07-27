import { View } from "react-native";

import { closeItemValidationMessage, isCloseItemInvalid } from "@/features/planning/closeCyclePresentation";
import { closeCycleActionTitle } from "@/features/planning/closeCycleUi";
import type { CloseAction, CloseReviewItem } from "@/features/planning/planningModel";

import { CloseCycleAmountSection } from "./CloseCycleAmountSection";
import { CloseCycleItemHeader } from "./CloseCycleItemHeader";
import { CloseCycleResolutionOptions } from "./CloseCycleResolutionOptions";
import { CloseCycleValidationMessage } from "./CloseCycleValidationMessage";

interface CloseCycleItemCardProps {
  amount: string;
  currencyCode: string;
  expanded: boolean;
  item: CloseReviewItem;
  locale: string;
  shortCycleLabel: string;
  onActionChange: (action: Exclude<CloseAction, null>) => void;
  onAmountChange: (amount: string) => void;
  onExpand: () => void;
}

export function CloseCycleItemCard({ amount, currencyCode, expanded, item, locale, shortCycleLabel, onActionChange, onAmountChange, onExpand }: CloseCycleItemCardProps) {
  const invalid = isCloseItemInvalid(item);
  const validation = closeItemValidationMessage(item);
  const statusLabel = item.action ? closeCycleActionTitle(item.action, item.activity.kind) : item.activity.timelineLabel ?? "Pending";
  const tone = reviewTone(item, invalid);

  return (
    <View className={`overflow-hidden rounded-xl border bg-background-muted ${expanded ? expandedBorderClass(tone) : "border-surface-border"}`}>
      <CloseCycleItemHeader amount={amount} currencyCode={currencyCode} expanded={expanded} item={item} locale={locale} statusLabel={statusLabel} tone={tone} onExpand={onExpand} />
      {expanded ? (
        <View className="gap-3 px-3 pb-3">
          <CloseCycleAmountSection amount={amount} currencyCode={currencyCode} item={item} locale={locale} onAmountChange={onAmountChange} />
          <CloseCycleResolutionOptions activityName={item.activity.name} kind={item.activity.kind} selectedAction={item.action} onActionChange={onActionChange} />
          <CloseCycleValidationMessage message={validation} fallback={closeReviewInfoText(item, shortCycleLabel)} />
        </View>
      ) : null}
    </View>
  );
}

function closeReviewInfoText(item: CloseReviewItem, shortCycleLabel: string) {
  if (item.activity.kind === "income") {
    return `No income recorded for this item in ${shortCycleLabel}.`;
  }
  return `No payment recorded for this commitment in ${shortCycleLabel}.`;
}

function reviewTone(item: CloseReviewItem, invalid: boolean) {
  if (item.action === "Paid") return "success";
  if (item.action === "Cancelled") return "danger";
  if (item.action === "Carry Forward") return "brand";
  if ((item.activity.timelineLabel ?? "").toLowerCase() === "overdue") return "danger";
  if (invalid) return "warning";
  return "brand";
}

function expandedBorderClass(tone: ReturnType<typeof reviewTone>) {
  if (tone === "danger") return "border-accent-rose/70";
  if (tone === "warning") return "border-accent-gold/70";
  if (tone === "success") return "border-state-success/60";
  return "border-brand-muted";
}
