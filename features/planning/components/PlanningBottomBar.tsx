import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import type { PlanningApiResponse } from "@/services/api/types";

interface PlanningBottomBarProps {
  currencyCode: string;
  locale: string;
  planning: PlanningApiResponse;
}

export function PlanningBottomBar({ currencyCode, locale, planning }: PlanningBottomBarProps) {
  const progress = planning.cycleProgress?.progressPercent ?? 0;
  const month = new Date(planning.cycle.startDate).toLocaleDateString(locale, { month: "long", year: "numeric" });

  return (
    <View className="absolute bottom-5 left-4 right-4 rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
      <View className="flex-row items-center gap-4">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-base font-bold text-text" numberOfLines={1}>{month}</Text>
          <Text className="font-sans text-xs text-text-muted">Day {planning.cycleProgress?.currentDay ?? 0} of {planning.cycleProgress?.totalDays ?? 0}</Text>
        </View>
        <View className="items-center">
          <Text className="font-sans text-base font-bold text-text">{progress}%</Text>
          <Text className="font-sans text-xs text-text-muted">Progress</Text>
        </View>
        <View className="min-w-0 flex-1 items-end">
          <CurrencyText value={planning.totals.remainingCommitments} currencyCode={currencyCode} locale={locale} className="text-base font-bold text-accent-gold" />
          <Text className="font-sans text-xs text-text-muted">Remaining</Text>
        </View>
      </View>
    </View>
  );
}
