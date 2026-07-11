import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { IconName } from "@/constants/navigation";
import { theme } from "@/theme";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: IconName;
  action?: ReactNode;
}

export function EmptyState({ title, message, icon = "star-outline", action }: EmptyStateProps) {
  return (
    <View className="items-center gap-4 rounded-lg border border-surface-border bg-surface p-6">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name={icon} size={theme.icons.md} color={theme.colors.brand.soft} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-center font-sans text-lg font-semibold text-text">{title}</Text>
        <Text className="text-center font-sans text-sm text-text-muted">{message}</Text>
      </View>
      {action}
    </View>
  );
}
