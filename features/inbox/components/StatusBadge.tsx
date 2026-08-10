import { Text, View } from "react-native";

import type { StatusBadgeTone } from "@/features/inbox/inboxModel";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  label: string;
  tone: StatusBadgeTone;
}

const toneClasses: Record<StatusBadgeTone, string> = {
  danger: "border-state-danger/40 bg-state-danger/10",
  success: "border-state-success/40 bg-state-success/10",
  warning: "border-state-warning/40 bg-state-warning/10"
};

const textClasses: Record<StatusBadgeTone, string> = {
  danger: "text-state-danger",
  success: "text-state-success",
  warning: "text-state-warning"
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <View className={cn("self-start rounded-full border px-2.5 py-1", toneClasses[tone])}>
      <Text className={cn("font-sans text-xs font-semibold", textClasses[tone])}>{label}</Text>
    </View>
  );
}
