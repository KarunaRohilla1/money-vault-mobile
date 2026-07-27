import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { activeFilterCount } from "@/features/reports/analytics/analyticsAdapter";
import type { ReportsAnalyticsFilters } from "@/features/reports/analytics/analyticsState";
import { theme } from "@/theme";

interface SpendingFilterButtonProps {
  filters: ReportsAnalyticsFilters;
  onPress: () => void;
}

export function SpendingFilterButton({ filters, onPress }: SpendingFilterButtonProps) {
  const count = activeFilterCount(filters);
  const active = count > 0;
  const label = active ? `Filters · ${count}` : "Filters";
  return (
    <Pressable
      accessibilityLabel={`${label}. Opens spending filters.`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`min-h-11 flex-row items-center justify-center gap-2 self-end rounded-xl border px-4 py-2.5 ${active ? "border-brand bg-brand-deep" : "border-surface-border bg-surface"}`}
      onPress={onPress}
    >
      <MaterialCommunityIcons name="tune-variant" size={theme.icons.sm} color={active ? theme.colors.brand.soft : theme.colors.text.muted} />
      <Text className={`font-sans text-sm font-semibold ${active ? "text-brand-soft" : "text-text-muted"}`}>{label}</Text>
    </Pressable>
  );
}
