import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { SecuritySection, SecuritySettingRow } from "@/features/settings/security/components/SecuritySettingRow";
import { SECURITY_COPY } from "@/features/settings/security/constants/security";
import { theme } from "@/theme";

interface AutoLockCardProps {
  currentLabel: string;
  disabled?: boolean;
  onPress: () => void;
}

export function AutoLockCard({ currentLabel, disabled = false, onPress }: AutoLockCardProps) {
  return (
    <SecuritySection title="Auto Lock">
      <SecuritySettingRow
        description={SECURITY_COPY.autoLockDescription}
        icon="timer-outline"
        onPress={() => {
          if (!disabled) {
            onPress();
          }
        }}
        title={SECURITY_COPY.autoLockTitle}
        trailing={
          <View className="min-h-12 flex-row items-center gap-1">
            <Text className="font-sans text-sm font-semibold text-brand-soft" maxFontSizeMultiplier={1.3}>
              {currentLabel}
            </Text>
            <MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />
          </View>
        }
      />
    </SecuritySection>
  );
}
