import { useEffect, useState } from "react";

import { ReminderBottomSheet } from "@/features/notifications/components/ReminderBottomSheet";
import { ReminderOptionGroup } from "@/features/notifications/components/ReminderOptionGroup";
import { ReminderTimePicker } from "@/features/notifications/components/ReminderTimePicker";
import {
  MONTHLY_REPEAT_OPTIONS,
  NOTIFICATION_COPY,
  type MonthlyRepeatPolicy
} from "@/features/notifications/constants/notifications";
import { formatReminderTime } from "@/features/notifications/services/notificationScheduler";
import type { MonthlyReminderSettings } from "@/features/notifications/types";

interface MonthlyReviewReminderSheetProps {
  initial: MonthlyReminderSettings;
  locale: string;
  onClose: () => void;
  onSave: (settings: MonthlyReminderSettings) => Promise<void> | void;
  saving?: boolean;
  visible: boolean;
}

export function MonthlyReviewReminderSheet({
  initial,
  locale,
  onClose,
  onSave,
  saving = false,
  visible
}: MonthlyReviewReminderSheetProps) {
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
        title="Monthly Review Reminder"
        visible={visible}
      >
        <ReminderOptionGroup
          onChange={(repeatPolicy: MonthlyRepeatPolicy) => setDraft((current) => ({ ...current, repeatPolicy }))}
          options={MONTHLY_REPEAT_OPTIONS}
          title={NOTIFICATION_COPY.monthlyRepeatTitle}
          value={draft.repeatPolicy}
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
