import { Text, View } from "react-native";

import { cn } from "@/lib/cn";

interface ConfidenceBadgeProps {
  className?: string;
  confidence: number;
  label?: string;
}

export function ConfidenceBadge({ className, confidence, label }: ConfidenceBadgeProps) {
  const display = `${Math.round(confidence)}% confidence`;

  return (
    <View className={cn("self-start rounded-full border border-state-success/40 bg-state-success/10 px-2.5 py-1", className)}>
      <Text className="font-sans text-xs font-semibold text-state-success">{label ?? display}</Text>
    </View>
  );
}
