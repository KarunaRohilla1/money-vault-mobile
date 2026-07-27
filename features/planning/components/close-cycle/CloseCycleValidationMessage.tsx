import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { closeCycleValidationText } from "@/features/planning/closeCycleUi";
import { theme } from "@/theme";

interface CloseCycleValidationMessageProps {
  message: string | null;
  fallback: string;
}

export function CloseCycleValidationMessage({ message, fallback }: CloseCycleValidationMessageProps) {
  const validation = closeCycleValidationText(message);
  const text = validation ?? fallback;
  const isValidation = Boolean(validation);

  return (
    <View className="flex-row items-start gap-2 px-1 py-1">
      <MaterialCommunityIcons name={isValidation ? "information-outline" : "check-circle-outline"} size={theme.icons.sm} color={isValidation ? theme.colors.accent.gold : theme.colors.text.muted} />
      <Text className={`min-w-0 flex-1 font-sans text-xs ${isValidation ? "font-semibold text-accent-gold" : "text-text-muted"}`}>{text}</Text>
    </View>
  );
}
