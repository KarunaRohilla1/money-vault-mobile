import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SecuritySection, SecuritySettingRow } from "@/features/settings/security/components/SecuritySettingRow";
import { SECURITY_COPY } from "@/features/settings/security/constants/security";
import { theme } from "@/theme";

interface PinCardProps {
  onPress: () => void;
}

export function PinCard({ onPress }: PinCardProps) {
  return (
    <SecuritySection title="PIN">
      <SecuritySettingRow
        description={SECURITY_COPY.changePinDescription}
        icon="lock-outline"
        onPress={onPress}
        title={SECURITY_COPY.changePinTitle}
        trailing={<MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />}
      />
    </SecuritySection>
  );
}
