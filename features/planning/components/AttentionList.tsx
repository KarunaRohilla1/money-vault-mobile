import { Text, View } from "react-native";

import { PlanningActivityRow } from "@/features/planning/components/PlanningActivityRow";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";

interface AttentionListProps {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  cycle: { startMonth: number; startYear: number };
  disabled?: boolean;
  locale: string;
  onComplete: (activity: PlanningActivityViewModel) => void;
  onMore: (activity: PlanningActivityViewModel) => void;
}

export function AttentionList({ activities, currencyCode, cycle, disabled, locale, onComplete, onMore }: AttentionListProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View>
        <Text className="font-sans text-lg font-semibold text-text">Needs attention</Text>
        <Text className="font-sans text-sm text-text-muted">Overdue and next-up planning items</Text>
      </View>
      <View className="rounded-xl border border-surface-border bg-surface px-4">
        {activities.map((activity, index) => (
          <View key={`${activity.kind}:${activity.id}`} className={index > 0 ? "border-t border-surface-border" : ""}>
            <PlanningActivityRow
              activity={activity}
              currencyCode={currencyCode}
              cycle={cycle}
              disabled={Boolean(disabled)}
              locale={locale}
              onComplete={onComplete}
              onMore={onMore}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
