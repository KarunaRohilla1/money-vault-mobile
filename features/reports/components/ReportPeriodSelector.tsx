import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/cn";
import type { ReportCycleOptionApi } from "@/services/api/types";
import { theme } from "@/theme";

interface ReportPeriodSelectorProps {
  onClose: () => void;
  onOpen: () => void;
  onSelect: (cycleStart: string) => void;
  options: ReportCycleOptionApi[];
  selectedKey: string;
  visible: boolean;
}

function selectedCycle(options: ReportCycleOptionApi[], selectedKey: string) {
  return options.find((option) => option.key === selectedKey) ?? options[options.length - 1] ?? null;
}

export function ReportPeriodSelector({ onClose, onOpen, onSelect, options, selectedKey, visible }: ReportPeriodSelectorProps) {
  const selected = selectedCycle(options, selectedKey);
  const label = selected ? `${selected.startDate} - ${selected.endDate}` : "Selected financial cycle";

  return (
    <>
      <View className="gap-3">
        <Text className="font-sans text-3xl font-semibold text-text">Reports</Text>
        <Pressable
          accessibilityLabel="Open financial cycle selector"
          accessibilityRole="button"
          className="min-h-11 flex-row items-center justify-between rounded-full border border-surface-border bg-surface px-4 py-2.5"
          onPress={onOpen}
        >
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
            <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-text" numberOfLines={1}>
              {label}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={theme.icons.sm} color={theme.colors.text.muted} />
        </Pressable>
      </View>

      <BottomSheet visible={visible} title="Financial Cycle" onClose={onClose}>
        <View className="gap-2">
          {options.slice(-6).map((option) => {
            const isSelected = option.key === selectedKey;
            return (
              <Pressable
                accessibilityLabel={`Select financial cycle ${option.startDate} to ${option.endDate}`}
                accessibilityRole="button"
                key={option.key}
                onPress={() => {
                  onSelect(option.key);
                  onClose();
                }}
                className={cn(
                  "min-h-14 rounded-lg border px-4 py-3",
                  isSelected ? "border-brand bg-brand-deep" : "border-surface-border bg-background-muted"
                )}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                      {option.label}
                    </Text>
                    <Text className="font-sans text-xs text-text-muted">
                      {option.startDate} - {option.endDate}
                    </Text>
                  </View>
                  {isSelected ? <MaterialCommunityIcons name="check-circle" size={theme.icons.sm} color={theme.colors.brand.soft} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
