import { Switch, Text, View } from "react-native";

import { theme } from "@/theme";

interface ReminderToggleRowProps {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}

export function ReminderToggleRow({ label, onValueChange, value }: ReminderToggleRowProps) {
  return (
    <View className="min-h-12 flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface px-4 py-4">
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
      </View>
      <View className="min-h-12 min-w-12 items-center justify-center">
        <Switch
          accessibilityLabel={label}
          accessibilityRole="switch"
          accessibilityState={{ checked: value }}
          ios_backgroundColor={theme.colors.surface.pressed}
          onValueChange={onValueChange}
          thumbColor={theme.colors.text.DEFAULT}
          trackColor={{ false: theme.colors.surface.pressed, true: theme.colors.brand.DEFAULT }}
          value={value}
        />
      </View>
    </View>
  );
}
