import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { CurrencyText, SecondaryButton } from "@/components/ui";
import { upcomingTimelineLabel, type PlanningActivityViewModel } from "@/features/planning/planningModel";
import { theme } from "@/theme";

interface PlanningActivityRowProps {
  activity: PlanningActivityViewModel;
  compact?: boolean;
  currencyCode: string;
  cycle: { startMonth: number; startYear: number };
  disabled?: boolean;
  locale: string;
  onComplete?: (activity: PlanningActivityViewModel) => void;
  onMore?: (activity: PlanningActivityViewModel) => void;
}

export function PlanningActivityRow({ activity, compact = false, currencyCode, cycle, disabled = false, locale, onComplete, onMore }: PlanningActivityRowProps) {
  const timeline = activity.timelineLabel ?? upcomingTimelineLabel(activity, cycle);
  const icon = activity.kind === "income" ? "cash" : (activity.icon as keyof typeof MaterialCommunityIcons.glyphMap);

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>{activity.name}</Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>{activity.kind === "income" ? "Income" : "Commitment"}{activity.accountName ? ` • ${activity.accountName}` : ""}</Text>
        {!compact ? (
          <View className="mt-1 flex-row flex-wrap gap-x-3 gap-y-1">
            <SmallMetric currencyCode={currencyCode} label="Expected" locale={locale} value={activity.expectedAmount} />
            <SmallMetric currencyCode={currencyCode} label="Actual" locale={locale} value={activity.actualAmount} />
            <Text className="font-sans text-[11px] text-text-muted">Due {timeline}</Text>
          </View>
        ) : null}
      </View>
      <View className="items-end gap-1">
        {compact ? <CurrencyText value={activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" /> : null}
        <Text className={statusClassName(activity.status)}>{activity.statusLabel}</Text>
        {!compact ? (
          <View className="flex-row items-center gap-2">
            {onComplete && activity.status === "PENDING" ? (
              <SecondaryButton className="h-9 px-3" disabled={disabled} onPress={() => onComplete(activity)}>{activity.completeLabel}</SecondaryButton>
            ) : null}
            {onMore ? (
              <Pressable accessibilityLabel={`More actions for ${activity.name}`} accessibilityRole="button" className="h-9 w-9 items-center justify-center rounded-full bg-background-muted" onPress={() => onMore(activity)}>
                <MaterialCommunityIcons name="dots-horizontal" size={theme.icons.sm} color={theme.colors.text.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SmallMetric({ currencyCode, label, locale, value }: { currencyCode: string; label: string; locale: string; value: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className="font-sans text-[11px] text-text-muted">{label}</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="text-[11px] font-semibold" />
    </View>
  );
}

function statusClassName(status: string) {
  if (status === "PAID" || status === "RECEIVED") {
    return "font-sans text-xs font-bold text-state-success";
  }

  if (status === "CANCELLED") {
    return "font-sans text-xs font-bold text-accent-rose";
  }

  if (status === "CARRIED_FORWARD") {
    return "font-sans text-xs font-bold text-accent-gold";
  }

  return "font-sans text-xs font-bold text-brand-soft";
}
