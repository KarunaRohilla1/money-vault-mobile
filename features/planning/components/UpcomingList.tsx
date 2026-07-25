import { Text, View } from "react-native";

import { PlanningActivityRow } from "@/features/planning/components/PlanningActivityRow";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";

interface UpcomingListProps {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  cycle: { startMonth: number; startYear: number };
  locale: string;
}

export function UpcomingList({ activities, currencyCode, cycle, locale }: UpcomingListProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <View>
        <Text className="font-sans text-lg font-semibold text-text">Upcoming</Text>
        <Text className="font-sans text-sm text-text-muted">Next pending items this cycle</Text>
      </View>
      <View className="rounded-xl bg-surface px-4">
        {activities.map((activity, index) => (
          <View key={`${activity.kind}:${activity.id}`} className={index > 0 ? "border-t border-surface-border" : ""}>
            <PlanningActivityRow activity={activity} compact currencyCode={currencyCode} cycle={cycle} locale={locale} />
          </View>
        ))}
      </View>
    </View>
  );
}
