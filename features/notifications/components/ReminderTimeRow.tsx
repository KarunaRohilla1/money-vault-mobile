import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/theme";

interface ReminderTimeRowProps {
  label?: string;
  onPress: () => void;
  valueLabel: string;
}

export function ReminderTimeRow({ label = "Reminder Time", onPress, valueLabel }: ReminderTimeRowProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-12 flex-row items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-4"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-muted">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="clock-outline" size={theme.icons.md} />
        </View>
        <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
      </View>
      <View className="min-h-12 flex-row items-center gap-1">
        <Text className="font-sans text-sm font-semibold text-brand-soft" maxFontSizeMultiplier={1.3}>
          {valueLabel}
        </Text>
        <MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />
      </View>
    </Pressable>
  );
}
