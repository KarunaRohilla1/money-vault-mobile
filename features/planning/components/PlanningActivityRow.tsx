import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
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
}

export function PlanningActivityRow({ activity, compact = false, currencyCode, cycle, disabled = false, locale, onComplete }: PlanningActivityRowProps) {
  const timeline = activity.timelineLabel ?? upcomingTimelineLabel(activity, cycle);
  const icon = activity.kind === "income" ? "cash" : (activity.icon as keyof typeof MaterialCommunityIcons.glyphMap);
  const actionLabel = activity.status === activity.completeStatus ? "Edit actual" : activity.kind === "income" ? "Record income" : "Record payment";

  if (compact) {
    return (
      <View className="flex-row items-center gap-3 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
          <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>{activity.name}</Text>
          <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>{timeline}</Text>
        </View>
        <CurrencyText value={activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
      </View>
    );
  }

  return (
    <View className="gap-3 py-3">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-brand-deep">
          <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>{activity.name}</Text>
              <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>{activity.kind === "income" ? "Income" : "Commitment"}{activity.accountName ? ` - ${activity.accountName}` : ""}</Text>
            </View>
            <Text className={statusClassName(activity.status)}>{activity.statusLabel}</Text>
          </View>
          <View className="mt-3 gap-2">
            <AmountLine currencyCode={currencyCode} label="Expected" locale={locale} value={activity.expectedAmount} />
            <AmountLine currencyCode={currencyCode} label="Actual" locale={locale} value={activity.actualEntered ? activity.actualAmount : null} />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-sans text-xs text-text-muted">Due</Text>
              <Text className="font-sans text-xs font-semibold text-text">{timeline}</Text>
            </View>
          </View>
        </View>
      </View>
      {onComplete ? (
        <View className="pl-14">
          <Text
            accessibilityRole="button"
            className={`self-start rounded-md border border-surface-border bg-surface px-3 py-2 font-sans text-xs font-semibold text-text ${disabled || activity.status === "CANCELLED" ? "opacity-50" : ""}`}
            onPress={disabled || activity.status === "CANCELLED" ? undefined : () => onComplete(activity)}
          >
            {actionLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function AmountLine({ currencyCode, label, locale, value }: { currencyCode: string; label: string; locale: string; value: number | null }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      {value === null ? (
        <Text className="font-sans text-xs font-semibold text-text-muted">Not entered</Text>
      ) : (
        <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="text-xs font-semibold" />
      )}
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
