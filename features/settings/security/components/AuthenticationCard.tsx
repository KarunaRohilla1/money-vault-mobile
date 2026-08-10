import { Switch, View } from "react-native";

import { SecuritySection, SecuritySettingRow } from "@/features/settings/security/components/SecuritySettingRow";
import { SECURITY_COPY } from "@/features/settings/security/constants/security";
import { theme } from "@/theme";

interface AuthenticationCardProps {
  disabled?: boolean;
  enabled: boolean;
  onValueChange: (next: boolean) => void;
}

export function AuthenticationCard({ disabled = false, enabled, onValueChange }: AuthenticationCardProps) {
  return (
    <SecuritySection title="Authentication">
      <SecuritySettingRow
        description={SECURITY_COPY.authenticationDescription}
        icon="fingerprint"
        title={SECURITY_COPY.authenticationTitle}
        trailing={
          <View className="min-h-12 min-w-12 items-center justify-center">
            <Switch
              accessibilityLabel={SECURITY_COPY.authenticationTitle}
              accessibilityRole="switch"
              accessibilityState={{ checked: enabled, disabled }}
              disabled={disabled}
              ios_backgroundColor={theme.colors.surface.pressed}
              onValueChange={onValueChange}
              thumbColor={theme.colors.text.DEFAULT}
              trackColor={{ false: theme.colors.surface.pressed, true: theme.colors.brand.DEFAULT }}
              value={enabled}
            />
          </View>
        }
      />
    </SecuritySection>
  );
}
