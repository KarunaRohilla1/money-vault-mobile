import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

interface SecuritySettingRowProps {
  description: string;
  icon: IconName;
  onPress?: () => void;
  title: string;
  trailing?: ReactNode;
}

export function SecuritySettingRow({ description, icon, onPress, title, trailing }: SecuritySettingRowProps) {
  const content = (
    <>
      <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-muted">
        <MaterialCommunityIcons color={theme.colors.brand.soft} name={icon} size={theme.icons.md} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
          {title}
        </Text>
        <Text className="font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
          {description}
        </Text>
      </View>
      {trailing ? <View className="ml-2 shrink-0 items-end justify-center">{trailing}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        className="min-h-12 flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface px-4 py-4"
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return <View className="min-h-12 flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface px-4 py-4">{content}</View>;
}

export function SecuritySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View className="gap-3">
      <Text className="font-sans text-xs font-bold uppercase tracking-wide text-text-muted" maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      {children}
    </View>
  );
}
