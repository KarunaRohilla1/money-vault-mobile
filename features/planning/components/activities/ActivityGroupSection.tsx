import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { type ActivityGroup } from "@/features/planning/activityPresentation";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";
import { theme } from "@/theme";

import { ActivityListRow } from "./ActivityListRow";

interface ActivityGroupSectionProps {
  currencyCode: string;
  group: ActivityGroup;
  locale: string;
  onActivityPress: (activity: PlanningActivityViewModel) => void;
}

export function ActivityGroupSection({ currencyCode, group, locale, onActivityPress }: ActivityGroupSectionProps) {
  return (
    <View className="gap-2">
      <View accessibilityRole="header" className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={headerIcon(group.tone)} size={theme.icons.sm} color={headerColor(group.tone)} />
        <Text className={headerClass(group.tone)}>{group.label}</Text>
      </View>
      <View className={`overflow-hidden rounded-xl border border-surface-border bg-surface ${group.tone === "danger" ? "border-l-4 border-l-accent-rose" : ""}`}>
        {group.activities.map((activity, index) => (
          <View key={`${activity.kind}:${activity.id}`} className={index > 0 ? "border-t border-surface-border" : ""}>
            <ActivityListRow activity={activity} currencyCode={currencyCode} locale={locale} onPress={onActivityPress} />
          </View>
        ))}
      </View>
    </View>
  );
}

function headerClass(tone: ActivityGroup["tone"]) {
  if (tone === "danger") return "font-sans text-sm font-bold text-accent-rose";
  if (tone === "warning") return "font-sans text-sm font-bold text-accent-gold";
  if (tone === "success") return "font-sans text-sm font-bold text-state-success";
  return "font-sans text-sm font-bold text-text-muted";
}

function headerColor(tone: ActivityGroup["tone"]) {
  if (tone === "danger") return theme.colors.accent.rose;
  if (tone === "warning") return theme.colors.accent.gold;
  if (tone === "success") return theme.colors.state.success;
  return theme.colors.text.muted;
}

function headerIcon(tone: ActivityGroup["tone"]): keyof typeof MaterialCommunityIcons.glyphMap {
  if (tone === "danger") return "alert-circle-outline";
  if (tone === "warning") return "calendar-alert";
  if (tone === "success") return "calendar-check-outline";
  return "calendar-month-outline";
}
