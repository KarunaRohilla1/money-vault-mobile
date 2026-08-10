import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

interface NotificationReminderCardProps {
  enabled: boolean;
  icon: IconName;
  onPress: () => void;
  subtitle: string;
  title: string;
}

export function NotificationReminderCard({ enabled, icon, onPress, subtitle, title }: NotificationReminderCardProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      className="min-h-12 flex-row items-center gap-3 border-b border-surface-border px-4 py-4 last:border-b-0"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-muted">
        <MaterialCommunityIcons color={theme.colors.brand.soft} name={icon} size={theme.icons.md} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
          {title}
        </Text>
        <Text className="font-sans text-sm text-text-muted" maxFontSizeMultiplier={1.4}>
          {subtitle}
        </Text>
      </View>
      {enabled ? (
        <Text className="font-sans text-xs font-bold uppercase text-brand-soft" maxFontSizeMultiplier={1.2}>
          On
        </Text>
      ) : null}
      <MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />
    </Pressable>
  );
}
