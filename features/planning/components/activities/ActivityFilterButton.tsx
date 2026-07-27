import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { activeFilterCount, typeFilterButtonLabel, type ActivityStatusFilter, type ActivityTypeFilter } from "@/features/planning/activityPresentation";
import { theme } from "@/theme";

interface ActivityFilterButtonProps {
  statusFilter: ActivityStatusFilter;
  typeFilter: ActivityTypeFilter;
  onPress: () => void;
}

export function ActivityFilterButton({ statusFilter, typeFilter, onPress }: ActivityFilterButtonProps) {
  const count = activeFilterCount(statusFilter, typeFilter);
  const label = count > 1 ? `Filters - ${count}` : typeFilterButtonLabel(typeFilter);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Activity filters" className="h-11 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-4" onPress={onPress}>
      <MaterialCommunityIcons name="filter-variant" size={theme.icons.sm} color={theme.colors.text.muted} />
      <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>{label}</Text>
      <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
    </Pressable>
  );
}
