import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

import type { IconName } from "@/constants/navigation";
import { cn } from "@/lib/cn";
import { theme } from "@/theme";

interface PrimaryButtonProps extends PropsWithChildren {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
  className?: string;
}

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  className
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={cn(
        "h-12 flex-row items-center justify-center rounded-md bg-brand px-5",
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text.inverse} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.text.inverse} /> : null}
          <Text className={cn("font-sans text-base font-semibold text-text-inverse", icon && "ml-2")}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}
