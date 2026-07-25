import { Text, View } from "react-native";

import { PlanningActivityRow } from "@/features/planning/components/PlanningActivityRow";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";

interface FinancialActivitiesCardProps {
  activities: PlanningActivityViewModel[];
  currencyCode: string;
  cycle: { startMonth: number; startYear: number };
  disabled?: boolean;
  locale: string;
  onComplete: (activity: PlanningActivityViewModel) => void;
  onMore: (activity: PlanningActivityViewModel) => void;
}

export function FinancialActivitiesCard({ activities, currencyCode, cycle, disabled, locale, onComplete, onMore }: FinancialActivitiesCardProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-sans text-sm font-bold uppercase text-text-muted">Financial Cycle Activities</Text>
        <Text className="font-sans text-xs text-text-muted">{activities.length === 0 ? "No activities" : "All up to date"}</Text>
      </View>
      <View className="rounded-xl border border-surface-border bg-surface px-4">
        {activities.length === 0 ? (
          <Text className="py-5 text-center font-sans text-sm text-text-muted">No planning activities for this cycle.</Text>
        ) : (
          activities.map((activity, index) => (
            <View key={`${activity.kind}:${activity.id}`} className={index > 0 ? "border-t border-surface-border" : ""}>
              <PlanningActivityRow activity={activity} currencyCode={currencyCode} cycle={cycle} disabled={Boolean(disabled)} locale={locale} onComplete={onComplete} onMore={onMore} />
            </View>
          ))
        )}
        {activities.length > 0 ? <Text className="border-t border-surface-border py-2 text-center font-sans text-xs text-text-muted">{activities.length} activities</Text> : null}
      </View>
    </View>
  );
}
