import { Text, View } from "react-native";

import { BottomSheet, CurrencyText, SecondaryButton } from "@/components/ui";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";

interface PlanningItemSheetProps {
  activity: PlanningActivityViewModel | null;
  currencyCode: string;
  locale: string;
  onCancel: (activity: PlanningActivityViewModel) => void;
  onClose: () => void;
  onReset: (activity: PlanningActivityViewModel) => void;
  visible: boolean;
}

export function PlanningItemSheet({ activity, currencyCode, locale, onCancel, onClose, onReset, visible }: PlanningItemSheetProps) {
  return (
    <BottomSheet visible={visible} title="Planning Item" onClose={onClose}>
      {activity ? (
        <View className="gap-4">
          <View className="rounded-xl bg-surface p-4">
            <Text className="font-sans text-lg font-semibold text-text">{activity.name}</Text>
            <Text className="mt-1 font-sans text-sm text-text-muted">
              Due day {activity.dueDay}
              {activity.accountName ? ` · ${activity.accountName}` : ""}
            </Text>
            <CurrencyText value={activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="mt-3 text-xl font-semibold" />
          </View>
          <View className="gap-3">
            <SecondaryButton
              icon="close-circle-outline"
              onPress={() => {
                onCancel(activity);
                onClose();
              }}
            >
              Cancel this cycle
            </SecondaryButton>
            <SecondaryButton
              icon="restore"
              onPress={() => {
                onReset(activity);
                onClose();
              }}
            >
              Mark pending
            </SecondaryButton>
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}
