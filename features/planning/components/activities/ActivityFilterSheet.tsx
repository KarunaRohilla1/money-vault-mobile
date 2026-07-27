import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui";
import { statusFilterLabels, typeFilterLabels, type ActivityStatusFilter, type ActivityTypeFilter } from "@/features/planning/activityPresentation";
import { theme } from "@/theme";

interface ActivityFilterSheetProps {
  billSupported: boolean;
  statusFilter: ActivityStatusFilter;
  typeFilter: ActivityTypeFilter;
  visible: boolean;
  onClose: () => void;
  onStatusFilterChange: (value: ActivityStatusFilter) => void;
  onTypeFilterChange: (value: ActivityTypeFilter) => void;
}

const statusOptions: ActivityStatusFilter[] = ["pending", "completed", "skipped", "all"];

export function ActivityFilterSheet({ billSupported, statusFilter, typeFilter, visible, onClose, onStatusFilterChange, onTypeFilterChange }: ActivityFilterSheetProps) {
  const typeOptions: ActivityTypeFilter[] = billSupported ? ["all", "income", "commitment", "bill"] : ["all", "income", "commitment"];

  return (
    <BottomSheet visible={visible} title="Filters" onClose={onClose}>
      <View className="gap-5">
        <OptionSection title="Activity type">
          {typeOptions.map((option) => (
            <SheetOption key={option} selected={typeFilter === option} label={option === "all" ? "All types" : typeFilterLabels[option]} onPress={() => onTypeFilterChange(option)} />
          ))}
        </OptionSection>
        <OptionSection title="Status">
          {statusOptions.map((option) => (
            <SheetOption key={option} selected={statusFilter === option} label={statusFilterLabels[option]} onPress={() => onStatusFilterChange(option)} />
          ))}
        </OptionSection>
      </View>
    </BottomSheet>
  );
}

function OptionSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-bold uppercase text-text-muted">{title}</Text>
      <View className="rounded-xl border border-surface-border bg-surface p-2">{children}</View>
    </View>
  );
}

function SheetOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} className={`min-h-11 flex-row items-center justify-between rounded-lg px-3 py-2 ${selected ? "bg-brand/15" : ""}`} onPress={onPress}>
      <Text className={`font-sans text-sm ${selected ? "font-semibold text-brand-soft" : "text-text"}`}>{label}</Text>
      {selected ? <MaterialCommunityIcons name="check" size={theme.icons.sm} color={theme.colors.brand.soft} /> : null}
    </Pressable>
  );
}
