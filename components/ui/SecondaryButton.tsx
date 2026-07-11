import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { PropsWithChildren } from "react";
import { Pressable, Text } from "react-native";

import type { IconName } from "@/constants/navigation";
import { cn } from "@/lib/cn";
import { theme } from "@/theme";

interface SecondaryButtonProps extends PropsWithChildren {
  onPress?: () => void;
  disabled?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
  className?: string;
}

export function SecondaryButton({
  children,
  onPress,
  disabled = false,
  icon,
  accessibilityLabel,
  className
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "h-12 flex-row items-center justify-center rounded-md border border-surface-border bg-surface px-5",
        disabled && "opacity-50",
        className
      )}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.text.DEFAULT} /> : null}
      <Text className={cn("font-sans text-base font-semibold text-text", icon && "ml-2")}>{children}</Text>
    </Pressable>
  );
}
