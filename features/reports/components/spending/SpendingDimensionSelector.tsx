import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { analysisDimensions, type AnalysisDimension } from "@/features/reports/analytics/analyticsState";
import { theme } from "@/theme";

interface SpendingDimensionSelectorProps {
  active: AnalysisDimension;
  onSelect: (dimension: AnalysisDimension) => void;
}

export function SpendingDimensionSelector({ active, onSelect }: SpendingDimensionSelectorProps) {
  return (
    <View accessibilityRole="tablist" className="min-h-12">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2" keyboardShouldPersistTaps="handled">
        {analysisDimensions.map((dimension) => {
          const selected = active === dimension.key;
          return (
            <Pressable
              accessibilityLabel={`${dimension.label} analysis${selected ? " selected" : ""}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`min-h-11 flex-row items-center gap-2 rounded-xl border px-4 py-2.5 ${selected ? "border-brand bg-brand" : "border-surface-border bg-surface"}`}
              key={dimension.key}
              onPress={() => onSelect(dimension.key)}
            >
              <MaterialCommunityIcons name={dimension.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={theme.icons.sm} color={selected ? theme.colors.text.DEFAULT : theme.colors.text.muted} />
              <Text className={`font-sans text-sm font-semibold ${selected ? "text-text" : "text-text-muted"}`} numberOfLines={1}>{dimension.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
