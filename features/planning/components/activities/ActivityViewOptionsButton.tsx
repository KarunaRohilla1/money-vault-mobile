import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { theme } from "@/theme";

export function ActivityViewOptionsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Activity view options" className="h-11 flex-row items-center gap-2 rounded-xl border border-surface-border bg-surface px-4" onPress={onPress}>
      <MaterialCommunityIcons name="tune-variant" size={theme.icons.sm} color={theme.colors.text.muted} />
      <Text className="font-sans text-sm font-semibold text-text">View options</Text>
    </Pressable>
  );
}
