import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { formatIsoDateOnly } from "@/lib/date";
import type { PlanningApiResponse } from "@/services/api/types";
import { theme } from "@/theme";

interface PlanningHeaderProps {
  currencyCode: string;
  locale: string;
  planning: PlanningApiResponse | null;
}

export function PlanningHeader({ currencyCode, locale, planning }: PlanningHeaderProps) {
  if (!planning) {
    return (
      <View className="gap-3">
        <Text className="font-sans text-3xl font-bold text-text">Planning</Text>
        <Text className="font-sans text-sm text-text-muted">Plan, execute and close</Text>
      </View>
    );
  }

  const range = `${formatIsoDateOnly(planning.cycle.startDate, locale, { day: "2-digit", month: "short" })} - ${formatIsoDateOnly(planning.cycle.endDate, locale, { day: "2-digit", month: "short", year: "numeric" })}`;
  const progress = planning.cycleProgress?.progressPercent ?? 0;
  const completion = planning.completion;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text className="font-sans text-3xl font-bold text-text">Planning</Text>
          <Text className="font-sans text-sm text-text-muted">Plan • Execute • Close</Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-surface">
          <MaterialCommunityIcons name="calendar-month-outline" size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
        </View>
      </View>

      <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-2xl font-bold text-text" numberOfLines={1}>{new Date(planning.cycle.startDate).toLocaleDateString(locale, { month: "long", year: "numeric" })}</Text>
            <Text className="font-sans text-sm text-text-muted">{range}</Text>
          </View>
          <View className="items-end">
            <Text className="font-sans text-xs text-text-muted">Day {planning.cycleProgress?.currentDay ?? 0} of {planning.cycleProgress?.totalDays ?? 0}</Text>
            <Text className="font-sans text-2xl font-bold text-text">{progress}%</Text>
          </View>
        </View>

        <View className="h-2 overflow-hidden rounded-full bg-background-muted">
          <View className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </View>

        <View className="flex-row flex-wrap gap-3">
          <HeaderMetric icon="calendar-start-outline" label="Started" value={planning.cycleProgress?.startLabel ?? planning.cycle.startDate} />
          <HeaderMetric icon="check-circle-outline" label="Completed" value={`${planning.cycleProgress?.daysCompleted ?? 0} Days`} />
          <HeaderMetric icon="clock-outline" label="Remaining" value={`${planning.cycleProgress?.daysRemaining ?? 0} Days`} />
          <HeaderMoney currencyCode={currencyCode} label="Projected Savings" locale={locale} value={planning.totals.projectedSavings} />
        </View>

        <View className="border-t border-surface-border pt-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full bg-background-muted px-3 py-1.5">
              <MaterialCommunityIcons name="trending-up" size={theme.icons.xs} color={completion?.status === "on_track" ? theme.colors.state.success : theme.colors.state.warning} />
              <Text className="font-sans text-xs font-bold text-state-success">{completion?.statusLabel ?? planning.cycleProgress?.status ?? planning.cycle.status}</Text>
            </View>
            <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>{completion?.subtitle ?? "Cycle status comes from the backend."}</Text>
            <Text className="font-sans text-xs text-text-muted">{completion?.attentionCount ?? 0} items need your attention</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function HeaderMetric({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View className="min-w-[46%] flex-1 gap-1 border-r border-surface-border pr-2">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icon} size={theme.icons.xs} color={theme.colors.text.muted} />
        <Text className="font-sans text-xs text-text-muted">{label}</Text>
      </View>
      <Text className="font-sans text-base font-bold text-text">{value}</Text>
    </View>
  );
}

function HeaderMoney({ currencyCode, label, locale, value }: { currencyCode: string; label: string; locale: string; value: number }) {
  return (
    <View className="min-w-[46%] flex-1 gap-1">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="text-base font-bold text-brand-soft" />
    </View>
  );
}
