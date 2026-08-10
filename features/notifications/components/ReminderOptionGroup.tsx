import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/theme";

export interface ReminderOption<T extends string> {
  label: string;
  value: T;
}

interface ReminderOptionGroupProps<T extends string> {
  onChange: (value: T) => void;
  options: readonly ReminderOption<T>[];
  title: string;
  value: T;
}

export function ReminderOptionGroup<T extends string>({
  onChange,
  options,
  title,
  value
}: ReminderOptionGroupProps<T>) {
  return (
    <View accessibilityLabel={title} accessibilityRole="radiogroup" className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text" maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <View className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        {options.map((option, index) => {
          const selected = value === option.value;

          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`min-h-12 flex-row items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-surface-border" : ""}`}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <MaterialCommunityIcons
                color={selected ? theme.colors.brand.DEFAULT : theme.colors.text.muted}
                name={selected ? "radiobox-marked" : "radiobox-blank"}
                size={theme.icons.md}
              />
              <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
