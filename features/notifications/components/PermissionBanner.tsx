import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui";
import { NOTIFICATION_MESSAGES } from "@/features/notifications/constants/notifications";
import { openDeviceNotificationSettings } from "@/features/notifications/services/notificationPermissions";
import { theme } from "@/theme";

export function PermissionBanner() {
  return (
    <View className="gap-4 rounded-xl border border-state-warning/40 bg-surface px-4 py-4">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-muted">
          <MaterialCommunityIcons color={theme.colors.state.warning} name="bell-alert-outline" size={theme.icons.md} />
        </View>
        <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
          {NOTIFICATION_MESSAGES.disabledBanner}
        </Text>
      </View>
      <PrimaryButton onPress={() => void openDeviceNotificationSettings()}>{NOTIFICATION_MESSAGES.openSettings}</PrimaryButton>
    </View>
  );
}
