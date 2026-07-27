import { Pressable, Text, View } from "react-native";

import { activeFilterCount, activeFilterSummary } from "@/features/reports/analytics/analyticsAdapter";
import type { ReportsAnalyticsFilters } from "@/features/reports/analytics/analyticsState";

interface SpendingActiveFilterSummaryProps {
  filters: ReportsAnalyticsFilters;
  onClear: () => void;
}

export function SpendingActiveFilterSummary({ filters, onClear }: SpendingActiveFilterSummaryProps) {
  const count = activeFilterCount(filters);
  const summary = activeFilterSummary(filters);
  if (count === 0 || !summary) {
    return null;
  }
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-lg bg-background-muted px-3 py-2">
      <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>{count} {count === 1 ? "filter" : "filters"} active · {summary}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Clear spending filters" className="min-h-8 justify-center" onPress={onClear}>
        <Text className="font-sans text-xs font-semibold text-brand-soft">Clear</Text>
      </Pressable>
    </View>
  );
}
