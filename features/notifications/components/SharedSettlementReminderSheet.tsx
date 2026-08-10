import { useEffect, useState } from "react";

import { ReminderBottomSheet } from "@/features/notifications/components/ReminderBottomSheet";
import { ReminderOptionGroup } from "@/features/notifications/components/ReminderOptionGroup";
import { ReminderTimePicker } from "@/features/notifications/components/ReminderTimePicker";
import { ReminderToggleRow } from "@/features/notifications/components/ReminderToggleRow";
import {
  NOTIFICATION_COPY,
  SHARED_FREQUENCY_OPTIONS,
  type SharedReminderFrequency
} from "@/features/notifications/constants/notifications";
import { formatReminderTime } from "@/features/notifications/services/notificationScheduler";
import type { SharedReminderSettings } from "@/features/notifications/types";

interface SharedSettlementReminderSheetProps {
  initial: SharedReminderSettings;
  locale: string;
  onClose: () => void;
  onSave: (settings: SharedReminderSettings) => Promise<void> | void;
  saving?: boolean;
  visible: boolean;
}

export function SharedSettlementReminderSheet({
  initial,
  locale,
  onClose,
  onSave,
  saving = false,
  visible
}: SharedSettlementReminderSheetProps) {
  const [draft, setDraft] = useState(initial);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(initial);
    }
  }, [initial, visible]);

  return (
    <>
      <ReminderBottomSheet
        onCancel={onClose}
        onSave={() => {
          void onSave({ ...draft, enabled: true });
        }}
        onTimePress={() => setTimePickerVisible(true)}
        saving={saving}
        timeLabel={formatReminderTime(draft.time, locale)}
        title="Shared Settlement Reminder"
        visible={visible}
      >
        <ReminderOptionGroup
          onChange={(frequency: SharedReminderFrequency) => setDraft((current) => ({ ...current, frequency }))}
          options={SHARED_FREQUENCY_OPTIONS}
          title={NOTIFICATION_COPY.sharedFrequencyTitle}
          value={draft.frequency}
        />
        <ReminderToggleRow
          label={NOTIFICATION_COPY.sharedOption}
          onValueChange={(onlyOutstanding) => setDraft((current) => ({ ...current, onlyOutstanding }))}
          value={draft.onlyOutstanding}
        />
      </ReminderBottomSheet>
      <ReminderTimePicker
        onChange={(time) => setDraft((current) => ({ ...current, time }))}
        onClose={() => setTimePickerVisible(false)}
        time={draft.time}
        visible={timePickerVisible}
      />
    </>
  );
}
