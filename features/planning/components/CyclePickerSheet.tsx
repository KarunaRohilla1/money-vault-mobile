import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheet, SecondaryButton } from "@/components/ui";
import { formatIsoDateOnly } from "@/lib/date";
import type { PlanningCycleOptionApi } from "@/services/api/types";
import { theme } from "@/theme";

type CycleStatusFilter = "all" | "completed" | "current" | "upcoming";

interface CyclePickerSheetProps {
  currentCycleStart: string | null;
  cycles: PlanningCycleOptionApi[];
  loading?: boolean;
  selectedCycleStart: string | null;
  selectedStatus: CycleStatusFilter;
  selectedYear: number;
  visible: boolean;
  onClose: () => void;
  onGoToCurrent: () => void;
  onNextYear: () => void;
  onPreviousYear: () => void;
  onSelect: (cycleStart: string) => void;
  onStatusChange: (status: CycleStatusFilter) => void;
}

export function CyclePickerSheet({
  currentCycleStart,
  cycles,
  loading = false,
  selectedCycleStart,
  selectedStatus,
  selectedYear,
  visible,
  onClose,
  onGoToCurrent,
  onNextYear,
  onPreviousYear,
  onSelect,
  onStatusChange
}: CyclePickerSheetProps) {
  return (
    <BottomSheet visible={visible} title="Financial Cycle" onClose={onClose}>
      <View className="gap-4">
        <View className="rounded-xl border border-surface-border bg-surface p-4">
          <Text className="font-sans text-xs uppercase text-text-muted">Selected cycle</Text>
          <Text className="mt-1 font-sans text-base font-semibold text-text">{selectedCycleStart ?? "Current cycle"}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-lg bg-background-muted" onPress={onPreviousYear}>
            <MaterialCommunityIcons name="chevron-left" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
          </Pressable>
          <Text className="font-sans text-xl font-bold text-text">{selectedYear}</Text>
          <Pressable accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-lg bg-background-muted" onPress={onNextYear}>
            <MaterialCommunityIcons name="chevron-right" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {(["all", "completed", "current", "upcoming"] as CycleStatusFilter[]).map((status) => (
            <Pressable
              accessibilityRole="button"
              className={`rounded-full px-3 py-2 ${selectedStatus === status ? "bg-brand" : "bg-background-muted"}`}
              key={status}
              onPress={() => onStatusChange(status)}
            >
              <Text className={`font-sans text-xs font-bold capitalize ${selectedStatus === status ? "text-white" : "text-text-muted"}`}>{status}</Text>
            </Pressable>
          ))}
        </View>

        <View className="gap-2">
          {loading ? <Text className="py-4 text-center font-sans text-sm text-text-muted">Loading cycles...</Text> : null}
          {!loading && cycles.length === 0 ? <Text className="py-4 text-center font-sans text-sm text-text-muted">No cycles match this filter.</Text> : null}
          {cycles.map((cycle) => {
            const selected = cycle.key === selectedCycleStart;
            const isCurrent = cycle.key === currentCycleStart;
            return (
              <Pressable
                accessibilityRole="button"
                className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${selected ? "border-brand bg-brand/15" : "border-surface-border bg-surface"}`}
                key={cycle.key}
                onPress={() => onSelect(cycle.key)}
              >
                <View className="min-w-0 flex-1 gap-1 pr-3">
                  <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
                    {formatIsoDateOnly(cycle.startDate, "en-IN", { month: "short", year: "numeric" })}
                  </Text>
                  <Text className="font-sans text-xs text-text-muted">
                    {formatIsoDateOnly(cycle.startDate, "en-IN", { day: "2-digit", month: "short" })} - {formatIsoDateOnly(cycle.endDate, "en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                  <Text className="font-sans text-xs font-semibold text-brand-soft">{cycle.status}{isCurrent ? " - Current" : ""}</Text>
                </View>
                {selected ? <MaterialCommunityIcons name="check-circle" size={theme.icons.sm} color={theme.colors.brand.DEFAULT} /> : null}
              </Pressable>
            );
          })}
        </View>

        <SecondaryButton icon="calendar-today" onPress={onGoToCurrent}>Go to current cycle</SecondaryButton>
      </View>
    </BottomSheet>
  );
}
