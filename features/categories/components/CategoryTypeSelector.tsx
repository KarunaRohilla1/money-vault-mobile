import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/theme";

const CATEGORY_TYPES = ["Expense", "Income"] as const;

interface CategoryTypeSelectorProps {
  error?: string;
  onChange: (value: string) => void;
  value: string | null;
}

export function CategoryTypeSelector({ error, onChange, value }: CategoryTypeSelectorProps) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {CATEGORY_TYPES.map((type) => {
          const selected = value === type;
          const icon = type === "Income" ? "trending-up" : "trending-down";
          return (
            <Pressable
              key={type}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={selected ? "h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-brand bg-brand-deep" : "h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface"}
              onPress={() => onChange(type)}
            >
              <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={selected ? theme.colors.brand.soft : theme.colors.text.muted} />
              <Text className="font-sans text-sm font-semibold text-text">{type}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="font-sans text-xs font-semibold text-accent-rose">{error}</Text> : null}
    </View>
  );
}
