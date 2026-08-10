import DateTimePicker, { type DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { parseReminderTime, serializeReminderTime } from "@/features/notifications/services/notificationScheduler";
import { theme } from "@/theme";

interface ReminderTimePickerProps {
  onChange: (time: string) => void;
  onClose: () => void;
  time: string;
  visible: boolean;
}

function dateFromTime(time: string) {
  const { hour, minute } = parseReminderTime(time);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function ReminderTimePicker({ onChange, onClose, time, visible }: ReminderTimePickerProps) {
  const [draft, setDraft] = useState(() => dateFromTime(time));

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(dateFromTime(time));
    }
  }, [time, visible]);

  if (!visible) {
    return null;
  }

  function handleValueChange(_event: DateTimePickerChangeEvent, selected: Date) {
    if (Platform.OS === "android") {
      onChange(serializeReminderTime(selected));
      onClose();
      return;
    }

    setDraft(selected);
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        display="default"
        mode="time"
        onDismiss={onClose}
        onValueChange={handleValueChange}
        value={dateFromTime(time)}
      />
    );
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-background-inset/80" onPress={onClose}>
        <Pressable className="rounded-t-xl border border-surface-border bg-surface-raised p-5" onPress={(event) => event.stopPropagation()}>
          <Text className="mb-3 font-sans text-lg font-semibold text-text">Reminder Time</Text>
          <View className="items-center rounded-xl bg-surface py-2">
            <DateTimePicker
              display="spinner"
              mode="time"
              onValueChange={handleValueChange}
              textColor={theme.colors.text.DEFAULT}
              value={draft}
            />
          </View>
          <View className="mt-4 gap-3">
            <PrimaryButton
              onPress={() => {
                onChange(serializeReminderTime(draft));
                onClose();
              }}
            >
              Done
            </PrimaryButton>
            <SecondaryButton onPress={onClose}>Cancel</SecondaryButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
