import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import type { IconName } from "@/constants/navigation";
import { theme } from "@/theme";

interface FABProps {
  onPress?: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
}

export function FAB({ onPress, icon = "plus", accessibilityLabel = "Add" }: FABProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      className="h-16 w-16 items-center justify-center rounded-full bg-brand shadow-glow"
    >
      <MaterialCommunityIcons name={icon} size={theme.icons.lg} color={theme.colors.text.inverse} />
    </Pressable>
  );
}
