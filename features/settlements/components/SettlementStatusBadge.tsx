import { Text, View } from "react-native";

import type { SettlementStatus } from "@/features/settlements/types";
import { settlementStatusLabel } from "@/features/settlements/settlementModel";

const toneByStatus: Record<SettlementStatus, { badge: string; text: string }> = {
  ADJUSTMENT: {
    badge: "bg-brand-muted",
    text: "text-brand-soft"
  },
  FULL: {
    badge: "bg-state-success/20",
    text: "text-state-success"
  },
  PARTIAL: {
    badge: "bg-state-warning/20",
    text: "text-state-warning"
  }
};

export function SettlementStatusBadge({
  label,
  status
}: {
  label?: string;
  status: SettlementStatus;
}) {
  const tone = toneByStatus[status];

  return (
    <View accessibilityLabel={label ?? settlementStatusLabel(status)} className={`self-start rounded-full px-2.5 py-1 ${tone.badge}`}>
      <Text className={`font-sans text-xs font-semibold ${tone.text}`}>{label ?? settlementStatusLabel(status)}</Text>
    </View>
  );
}
