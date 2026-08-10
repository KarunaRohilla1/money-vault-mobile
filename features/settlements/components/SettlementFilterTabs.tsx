import { Pressable, Text, View } from "react-native";

import { SETTLEMENT_DIRECTION_FILTERS } from "@/features/settlements/settlementModel";
import type { SettlementDirectionFilter } from "@/features/settlements/types";

export function SettlementFilterTabs({
  onChange,
  value
}: {
  onChange: (value: SettlementDirectionFilter) => void;
  value: SettlementDirectionFilter;
}) {
  return (
    <View accessibilityRole="tablist" className="flex-row border-b border-surface-border">
      {SETTLEMENT_DIRECTION_FILTERS.map((filter) => {
        const active = filter.id === value;

        return (
          <Pressable
            key={filter.id}
            accessibilityLabel={filter.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="min-h-12 flex-1 items-center justify-center px-2"
            onPress={() => onChange(filter.id)}
          >
            <Text className={active ? "font-sans text-sm font-semibold text-brand-soft" : "font-sans text-sm font-semibold text-text-muted"}>
              {filter.label}
            </Text>
            <View className={active ? "mt-2 h-0.5 w-full rounded-full bg-brand" : "mt-2 h-0.5 w-full rounded-full bg-transparent"} />
          </Pressable>
        );
      })}
    </View>
  );
}
