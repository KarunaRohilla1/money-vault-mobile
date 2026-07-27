import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { closeCycleSelectedSummary } from "@/features/planning/closeCycleUi";
import type { CloseReviewItem, PlanningActivityKind } from "@/features/planning/planningModel";
import { theme } from "@/theme";

type ReviewTone = "brand" | "danger" | "success" | "warning";

interface CloseCycleItemHeaderProps {
  amount: string;
  currencyCode: string;
  expanded: boolean;
  item: CloseReviewItem;
  locale: string;
  statusLabel: string;
  tone: ReviewTone;
  onExpand: () => void;
}

export function CloseCycleItemHeader({ amount, currencyCode, expanded, item, locale, statusLabel, tone, onExpand }: CloseCycleItemHeaderProps) {
  const selectedSummary = closeCycleSelectedSummary(item, currencyCode, locale);
  const accountText = item.activity.accountName ? `${item.activity.kind === "income" ? "Income" : "Commitment"} \u2022 ${item.activity.accountName}` : item.activity.kind === "income" ? "Income" : "Commitment";
  const accessibilityLabel = [
    item.activity.name,
    item.activity.kind,
    item.activity.accountName,
    statusLabel,
    `${amount || item.activity.expectedAmount} expected`,
    selectedSummary ?? "no action selected"
  ].filter(Boolean).join(", ");

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} className="flex-row items-start gap-3 px-3 py-3" onPress={onExpand}>
      <View className={`mt-3 h-2 w-2 rounded-full ${dotClass(tone)}`} />
      <View className={`h-12 w-12 items-center justify-center rounded-xl ${iconBgClass(item.activity.kind)}`}>
        <MaterialCommunityIcons name={activityIcon(item.activity.kind, item.activity.name)} size={theme.icons.md} color={iconColor(item.activity.kind)} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-lg font-semibold text-text">{item.activity.name}</Text>
        <Text className="font-sans text-sm text-text-muted">{accountText}</Text>
        {!expanded && selectedSummary ? <Text className="font-sans text-xs font-semibold text-brand-soft">{selectedSummary}</Text> : null}
      </View>
      <View className="items-end gap-1">
        <Text className={statusTextClass(tone)}>{statusLabel}</Text>
      </View>
      <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={theme.icons.md} color={theme.colors.text.muted} />
    </Pressable>
  );
}

function activityIcon(kind: PlanningActivityKind, name: string) {
  if (kind === "income") return "cash";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("card")) return "credit-card-outline";
  if (lowerName.includes("rent") || lowerName.includes("home")) return "home-outline";
  if (lowerName.includes("electric") || lowerName.includes("power")) return "lightning-bolt-outline";
  return "clipboard-text-outline";
}

function iconBgClass(kind: PlanningActivityKind) {
  return kind === "income" ? "bg-accent-gold/15" : "bg-brand/15";
}

function iconColor(kind: PlanningActivityKind) {
  return kind === "income" ? theme.colors.accent.gold : theme.colors.brand.soft;
}

function dotClass(tone: ReviewTone) {
  if (tone === "success") return "bg-state-success";
  if (tone === "danger") return "bg-accent-rose";
  if (tone === "warning") return "bg-accent-gold";
  return "bg-brand-soft";
}

function statusTextClass(tone: ReviewTone) {
  if (tone === "danger") return "font-sans text-xs font-semibold text-accent-rose";
  if (tone === "warning") return "font-sans text-xs font-semibold text-accent-gold";
  if (tone === "success") return "font-sans text-xs font-semibold text-state-success";
  return "font-sans text-xs font-semibold text-brand-soft";
}
