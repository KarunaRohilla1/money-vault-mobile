import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { theme } from "@/theme";

export function ActivityEmptyState({ message, title }: { message: string; title: string }) {
  return (
    <View className="items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-6">
      <MaterialCommunityIcons name="calendar-check-outline" size={theme.icons.lg} color={theme.colors.text.muted} />
      <Text className="font-sans text-base font-semibold text-text">{title}</Text>
      <Text className="text-center font-sans text-sm text-text-muted">{message}</Text>
    </View>
  );
}
