import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { activityAccessibilityLabel, type PresentedPlanningActivity } from "@/features/planning/activityPresentation";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";
import { theme } from "@/theme";

interface ActivityListRowProps {
  activity: PresentedPlanningActivity;
  currencyCode: string;
  locale: string;
  onPress: (activity: PlanningActivityViewModel) => void;
}

export const ActivityListRow = memo(function ActivityListRow({ activity, currencyCode, locale, onPress }: ActivityListRowProps) {
  const icon = activity.kind === "income" ? "cash" : (activity.icon as keyof typeof MaterialCommunityIcons.glyphMap);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={activityAccessibilityLabel(activity, currencyCode, locale)}
      className="min-h-18 flex-row items-center gap-3 px-3 py-2.5"
      onPress={() => onPress(activity)}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text" numberOfLines={2}>{activity.name}</Text>
        <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>{activity.typeLabel}{activity.accountName ? ` \u2022 ${activity.accountName}` : ""}</Text>
      </View>
      <View className="max-w-28 items-end gap-0.5">
        <Text className={dueLabelClass(activity.urgency, activity.presentationStatus)} numberOfLines={1}>{activity.dueLabel}</Text>
        <CurrencyText value={activity.effectiveAmount} currencyCode={currencyCode} locale={locale} className="text-base font-semibold" />
      </View>
      <MaterialCommunityIcons name="chevron-right" size={theme.icons.md} color={theme.colors.text.muted} />
    </Pressable>
  );
});

function dueLabelClass(urgency: PresentedPlanningActivity["urgency"], status: PresentedPlanningActivity["presentationStatus"]) {
  if (urgency === "overdue" || status === "skipped") {
    return "font-sans text-sm font-semibold text-accent-rose";
  }
  if (urgency === "today" || urgency === "thisWeek" || status === "carriedForward") {
    return "font-sans text-sm font-semibold text-accent-gold";
  }
  if (status === "completed") {
    return "font-sans text-sm font-semibold text-state-success";
  }
  return "font-sans text-sm font-semibold text-text-muted";
}
