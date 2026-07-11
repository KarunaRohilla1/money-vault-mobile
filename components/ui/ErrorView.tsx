import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { theme } from "@/theme";

interface ErrorViewProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorView({ title = "Unable to load", message, retryLabel = "Try again", onRetry }: ErrorViewProps) {
  return (
    <View className="items-center gap-4 rounded-lg border border-surface-border bg-surface p-6">
      <MaterialCommunityIcons name="alert-circle-outline" size={theme.icons.lg} color={theme.colors.state.danger} />
      <View className="items-center gap-1">
        <Text className="text-center font-sans text-lg font-semibold text-text">{title}</Text>
        <Text className="text-center font-sans text-sm text-text-muted">{message}</Text>
      </View>
      {onRetry ? <SecondaryButton onPress={onRetry}>{retryLabel}</SecondaryButton> : null}
    </View>
  );
}
