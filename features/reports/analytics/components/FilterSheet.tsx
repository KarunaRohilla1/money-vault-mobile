import { Pressable, Text, View } from "react-native";

import { BottomSheet, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { ReportsAnalyticsFilters } from "@/features/reports/analytics/analyticsState";
import type { ReportSpendingFilterOptionsApi } from "@/services/api/types";

interface FilterSheetProps {
  filters: ReportsAnalyticsFilters;
  onApply: (filters: ReportsAnalyticsFilters) => void;
  onClear: () => void;
  onClose: () => void;
  options?: ReportSpendingFilterOptionsApi | undefined;
  visible: boolean;
}

const groups: { key: keyof ReportsAnalyticsFilters; label: string; optionsKey: keyof ReportSpendingFilterOptionsApi }[] = [
  { key: "merchant", label: "Categories", optionsKey: "merchants" },
  { key: "account", label: "Accounts", optionsKey: "accounts" },
  { key: "paymentMode", label: "Payment Modes", optionsKey: "paymentModes" }
];

export function FilterSheet({ filters, onApply, onClear, onClose, options, visible }: FilterSheetProps) {
  function toggle(key: keyof ReportsAnalyticsFilters, value: string) {
    onApply({ ...filters, [key]: filters[key] === value ? undefined : value });
  }

  return (
    <BottomSheet visible={visible} title="Spending Filters" onClose={onClose}>
      <View className="gap-5">
        {groups.map((group) => (
          <View className="gap-2" key={group.key}>
            <Text className="font-sans text-xs font-bold uppercase text-text-muted">{group.label}</Text>
            <View className="flex-row flex-wrap gap-2">
              {(options?.[group.optionsKey] ?? []).slice(0, 16).map((value) => {
                const selected = filters[group.key] === value;
                return <Pressable accessibilityRole="button" className={`rounded-full px-3 py-2 ${selected ? "bg-brand" : "bg-background-muted"}`} key={value} onPress={() => toggle(group.key, value)}><Text className={`font-sans text-xs font-semibold ${selected ? "text-white" : "text-text-muted"}`}>{value}</Text></Pressable>;
              })}
            </View>
          </View>
        ))}
        <PrimaryButton onPress={onClose}>Apply</PrimaryButton>
        <SecondaryButton onPress={onClear}>Clear filters</SecondaryButton>
      </View>
    </BottomSheet>
  );
}
