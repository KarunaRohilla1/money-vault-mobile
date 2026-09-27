import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SecuritySection, SecuritySettingRow } from "@/features/settings/security/components/SecuritySettingRow";
import { SECURITY_COPY } from "@/features/settings/security/constants/security";
import { theme } from "@/theme";

interface RecoveryCodeCardProps {
  onPress: () => void;
}

export function RecoveryCodeCard({ onPress }: RecoveryCodeCardProps) {
  return (
    <SecuritySection title="Recovery">
      <SecuritySettingRow
        description={SECURITY_COPY.recoveryCodeDescription}
        icon="key-outline"
        onPress={onPress}
        title={SECURITY_COPY.recoveryCodeTitle}
        trailing={<MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />}
      />
    </SecuritySection>
  );
}
