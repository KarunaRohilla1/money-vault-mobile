import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui";
import { groupModeLabels, sortModeLabels, type ActivityGroupMode, type ActivitySortMode } from "@/features/planning/activityPresentation";
import { theme } from "@/theme";

interface ActivityViewOptionsSheetProps {
  groupMode: ActivityGroupMode;
  sortMode: ActivitySortMode;
  visible: boolean;
  onClose: () => void;
  onGroupModeChange: (value: ActivityGroupMode) => void;
  onSortModeChange: (value: ActivitySortMode) => void;
}

const groupModes: ActivityGroupMode[] = ["dueDate", "type", "status", "account", "none"];
const sortModes: ActivitySortMode[] = ["dueSoonest", "dueLatest", "amountHighest", "amountLowest", "nameAsc", "nameDesc"];

export function ActivityViewOptionsSheet({ groupMode, sortMode, visible, onClose, onGroupModeChange, onSortModeChange }: ActivityViewOptionsSheetProps) {
  return (
    <BottomSheet visible={visible} title="View options" onClose={onClose}>
      <View className="gap-5">
        <OptionSection title="Group by">
          {groupModes.map((option) => (
            <SheetOption key={option} selected={groupMode === option} label={groupModeLabels[option]} onPress={() => onGroupModeChange(option)} />
          ))}
        </OptionSection>
        <OptionSection title="Sort by">
          {sortModes.map((option) => (
            <SheetOption key={option} selected={sortMode === option} label={sortModeLabels[option]} onPress={() => onSortModeChange(option)} />
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
