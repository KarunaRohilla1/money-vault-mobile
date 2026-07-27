import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { closeCycleActionOptions } from "@/features/planning/closeCycleUi";
import type { CloseAction, PlanningActivityKind } from "@/features/planning/planningModel";
import { theme } from "@/theme";

interface CloseCycleResolutionOptionsProps {
  activityName: string;
  kind: PlanningActivityKind;
  selectedAction: CloseAction;
  onActionChange: (action: Exclude<CloseAction, null>) => void;
}

export function CloseCycleResolutionOptions({ activityName, kind, selectedAction, onActionChange }: CloseCycleResolutionOptionsProps) {
  return (
    <View accessibilityLabel={`How should ${activityName} be resolved?`} accessibilityRole="radiogroup" className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text">How should this item be resolved?</Text>
      {closeCycleActionOptions(kind).map((option) => (
        <CloseCycleResolutionOption
          description={option.description}
          key={option.action}
          label={option.label}
          selected={selectedAction === option.action}
          tone={option.tone}
          onPress={() => onActionChange(option.action)}
        />
      ))}
    </View>
  );
}

function CloseCycleResolutionOption({ description, label, selected, tone, onPress }: { description: string; label: string; selected: boolean; tone: "danger" | "success" | "warning"; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`${label}. ${description}.`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`min-h-12 flex-row items-start gap-3 rounded-xl px-3 py-3 ${selected ? selectedActionClass(tone) : "bg-surface"}`}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={selected ? "radiobox-marked" : "radiobox-blank"} size={theme.icons.md} color={selected ? selectedActionColor(tone) : theme.colors.text.muted} />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text">{label}</Text>
        <Text className="font-sans text-xs text-text-muted">{description}</Text>
      </View>
    </Pressable>
  );
}

function selectedActionClass(tone: "danger" | "success" | "warning") {
  if (tone === "success") return "border border-state-success bg-state-success/10";
  if (tone === "danger") return "border border-accent-rose bg-accent-rose/10";
  return "border border-accent-gold bg-accent-gold/10";
}

function selectedActionColor(tone: "danger" | "success" | "warning") {
  if (tone === "success") return theme.colors.state.success;
  if (tone === "danger") return theme.colors.accent.rose;
  return theme.colors.accent.gold;
}
