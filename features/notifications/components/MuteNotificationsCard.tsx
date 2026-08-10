import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Switch, Text, View } from "react-native";

import { NOTIFICATION_COPY } from "@/features/notifications/constants/notifications";
import { theme } from "@/theme";

interface MuteNotificationsCardProps {
  disabled?: boolean;
  muted: boolean;
  onValueChange: (muted: boolean) => void;
}

export function MuteNotificationsCard({ disabled = false, muted, onValueChange }: MuteNotificationsCardProps) {
  return (
    <View className="gap-3">
      <View className="min-h-12 flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface px-4 py-4">
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-muted">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="bell-off-outline" size={theme.icons.md} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-sans text-base font-semibold text-text" maxFontSizeMultiplier={1.4}>
            {NOTIFICATION_COPY.muteTitle}
          </Text>
          <Text className="font-sans text-sm leading-5 text-text-muted" maxFontSizeMultiplier={1.4}>
            {NOTIFICATION_COPY.muteDescription}
          </Text>
        </View>
        <View className="min-h-12 min-w-12 items-center justify-center">
          <Switch
            accessibilityLabel={NOTIFICATION_COPY.muteTitle}
            accessibilityRole="switch"
            accessibilityState={{ checked: muted, disabled }}
            disabled={disabled}
            ios_backgroundColor={theme.colors.surface.pressed}
            onValueChange={onValueChange}
            thumbColor={theme.colors.text.DEFAULT}
            trackColor={{ false: theme.colors.surface.pressed, true: theme.colors.brand.DEFAULT }}
            value={muted}
          />
        </View>
      </View>

      <View className="flex-row items-start gap-2 px-1">
        <MaterialCommunityIcons color={theme.colors.text.subtle} name="information-outline" size={theme.icons.sm} />
        <Text className="min-w-0 flex-1 font-sans text-xs leading-4 text-text-subtle" maxFontSizeMultiplier={1.3}>
          {NOTIFICATION_COPY.muteFooter}
        </Text>
      </View>
    </View>
  );
}
