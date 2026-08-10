import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { theme } from "@/theme";

export function EmptySettlementState({
  message = "When balances are settled they'll appear here.",
  title = "No settlements yet"
}: {
  message?: string;
  title?: string;
}) {
  return (
    <View
      accessibilityLabel={`${title}. ${message}`}
      accessibilityRole="summary"
      className="items-center gap-3 rounded-xl border border-surface-border bg-surface px-5 py-8"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-raised">
        <MaterialCommunityIcons name="receipt" size={theme.icons.lg} color={theme.colors.text.muted} />
      </View>
      <Text className="font-sans text-base font-semibold text-text">{title}</Text>
      <Text className="text-center font-sans text-sm text-text-muted">{message}</Text>
    </View>
  );
}

export function SettlementEndOfList() {
  return (
    <EmptySettlementState message="You've reached the end of your settlement history." title="That's all!" />
  );
}
