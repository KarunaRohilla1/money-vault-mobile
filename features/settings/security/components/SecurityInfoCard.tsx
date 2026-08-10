import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { SECURITY_COPY } from "@/features/settings/security/constants/security";
import { theme } from "@/theme";

export function SecurityInfoCard() {
  return (
    <View
      accessibilityRole="text"
      className="min-h-12 flex-row items-start gap-3 rounded-xl border border-surface-border bg-surface px-4 py-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-muted">
        <MaterialCommunityIcons color={theme.colors.brand.soft} name="shield-check-outline" size={theme.icons.md} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
          {SECURITY_COPY.infoTitle}
        </Text>
        <Text className="font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
          {SECURITY_COPY.infoBody}
        </Text>
      </View>
    </View>
  );
}
