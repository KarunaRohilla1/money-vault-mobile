import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { adjacentReportCycle, formatReportCycleRange, reportCycleDisplayMonth, selectedReportCycle } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportCycleOptionApi } from "@/services/api/types";
import { theme } from "@/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

interface ReportsHeaderProps {
  locale: string;
  onNext: () => void;
  onOpenPicker: () => void;
  onPrevious: () => void;
  options: ReportCycleOptionApi[];
  selectedKey: string;
}

export function ReportsHeader({ locale, onNext, onOpenPicker, onPrevious, options, selectedKey }: ReportsHeaderProps) {
  const selected = selectedReportCycle(options, selectedKey);
  const previous = adjacentReportCycle(options, selectedKey, "previous");
  const next = adjacentReportCycle(options, selectedKey, "next");

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text className="font-sans text-3xl font-bold text-text">Reports</Text>
          <Text className="font-sans text-sm text-text-muted">Understand your money, make better decisions.</Text>
        </View>
        <Pressable
          accessibilityLabel="Choose financial cycle"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-surface"
          onPress={onOpenPicker}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
        </Pressable>
      </View>

      <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
        <View className="flex-row items-start justify-between gap-3">
          <CycleArrow disabled={!previous} icon="chevron-left" label="Previous financial cycle" onPress={onPrevious} />
          <Pressable accessibilityLabel="Choose financial cycle" accessibilityRole="button" className="min-w-0 flex-1 items-center" onPress={onOpenPicker}>
            <Text className="text-center font-sans text-2xl font-bold text-text" numberOfLines={1}>{selected ? reportCycleDisplayMonth(selected, locale) : "Selected cycle"}</Text>
            <Text className="mt-1 text-center font-sans text-sm text-text-muted" numberOfLines={1}>
              {selected ? formatReportCycleRange(selected.startDate, selected.endDate, locale) : "Financial cycle"}
            </Text>
          </Pressable>
          <CycleArrow disabled={!next} icon="chevron-right" label="Next financial cycle" onPress={onNext} />
        </View>
      </View>
    </View>
  );
}

function CycleArrow({ disabled, icon, label, onPress }: { disabled: boolean; icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={cn("h-9 w-9 items-center justify-center rounded-lg bg-background-muted", disabled ? "opacity-35" : "opacity-100")}
      disabled={disabled}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
    </Pressable>
  );
}
