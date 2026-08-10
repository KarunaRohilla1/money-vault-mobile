import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { BottomSheet, PrimaryButton, SecondaryButton } from "@/components/ui";
import { ReminderTimeRow } from "@/features/notifications/components/ReminderTimeRow";

interface ReminderBottomSheetProps extends PropsWithChildren {
  onCancel: () => void;
  onSave: () => void;
  onTimePress: () => void;
  saving?: boolean;
  timeLabel: string;
  title: string;
  visible: boolean;
}

export function ReminderBottomSheet({
  children,
  onCancel,
  onSave,
  onTimePress,
  saving = false,
  timeLabel,
  title,
  visible
}: ReminderBottomSheetProps) {
  return (
    <BottomSheet onClose={onCancel} title={title} visible={visible}>
      <View className="gap-5">
        <ReminderTimeRow onPress={onTimePress} valueLabel={timeLabel} />

        {children}

        <View className="gap-3">
          <SecondaryButton disabled={saving} onPress={onCancel}>
            Cancel
          </SecondaryButton>
          <PrimaryButton loading={saving} onPress={onSave}>
            Save
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}
