import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { analysisDimensions, hasAnalyticsFilters, type AnalysisDimension, type ReportsAnalyticsFilters } from "@/features/reports/analytics/analyticsState";
import { theme } from "@/theme";

export function DimensionSelector({ active, filters, onFilterPress, onSelect }: {
  active: AnalysisDimension;
  filters: ReportsAnalyticsFilters;
  onFilterPress: () => void;
  onSelect: (dimension: AnalysisDimension) => void;
}) {
  const filtersActive = hasAnalyticsFilters(filters);
  return (
    <View className="flex-row flex-wrap gap-2">
      {analysisDimensions.map((dimension) => {
        const selected = active === dimension.key;
        return (
          <Pressable accessibilityRole="button" className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${selected ? "border-brand bg-brand-deep" : "border-surface-border bg-surface"}`} key={dimension.key} onPress={() => onSelect(dimension.key)}>
            <MaterialCommunityIcons name={dimension.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.xs} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
            <Text className={`font-sans text-sm ${selected ? "text-brand-soft" : "text-text-muted"}`}>{dimension.label}</Text>
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${filtersActive ? "border-brand bg-brand-deep" : "border-surface-border bg-surface"}`} onPress={onFilterPress}>
        <MaterialCommunityIcons name="filter-variant" size={theme.icons.xs} color={filtersActive ? theme.colors.brand.soft : theme.colors.text.muted} />
        <Text className={`font-sans text-sm ${filtersActive ? "text-brand-soft" : "text-text-muted"}`}>Filters</Text>
      </Pressable>
    </View>
  );
}
