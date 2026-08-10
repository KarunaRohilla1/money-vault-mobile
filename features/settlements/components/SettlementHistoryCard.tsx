import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import { SettlementStatusBadge } from "@/features/settlements/components/SettlementStatusBadge";
import type { SettlementListItem } from "@/features/settlements/types";
import { formatCurrency } from "@/lib/format";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

function statusIcon(item: SettlementListItem) {
  if (item.status === "PARTIAL") {
    return {
      background: "bg-state-warning/20",
      color: theme.colors.state.warning,
      name: "circle-slice-4" as const
    };
  }

  return {
    background: "bg-state-success/20",
    color: theme.colors.state.success,
    name: "check" as const
  };
}

export function SettlementHistoryCard({
  currencyCode,
  item,
  locale,
  onPress,
  variant = "compact"
}: {
  currencyCode: CurrencyCode | string;
  item: SettlementListItem;
  locale: string;
  onPress?: (item: SettlementListItem) => void;
  variant?: "compact" | "detailed";
}) {
  const icon = statusIcon(item);
  const amountClassName = item.isReceived ? "font-sans text-sm font-semibold text-state-success" : "font-sans text-sm font-semibold text-text";
  const metaParts = [item.paymentMethod, item.notes].filter(Boolean);
  const accessibilityLabel = `${item.title}, ${item.statusLabel}, ${item.amount}, ${item.dateLabel}`;

  return (
    <Pressable
      accessibilityHint="Opens settlement details"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="min-h-12"
      disabled={!onPress}
      onPress={() => onPress?.(item)}
    >
      <View className={`${dashboardLayout.cardClassName} gap-3 p-4`}>
        <View className="flex-row items-start gap-3">
          <View className={`h-11 w-11 items-center justify-center rounded-full ${icon.background}`}>
            <MaterialCommunityIcons name={icon.name} size={theme.icons.md} color={icon.color} />
          </View>

          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-sans text-sm font-semibold text-text" numberOfLines={2}>
              {item.title}
            </Text>
            {variant === "compact" ? (
              <SettlementStatusBadge status={item.status} />
            ) : (
              <View className="flex-row flex-wrap items-center gap-2">
                <SettlementStatusBadge status={item.status} />
                <Text className="font-sans text-xs text-text-muted">
                  {item.dateLabel}
                  {item.timeLabel ? `, ${item.timeLabel}` : ""}
                </Text>
              </View>
            )}
          </View>

          <View className="items-end gap-1">
            <CurrencyText value={item.amount} currencyCode={currencyCode} locale={locale} className={amountClassName} />
            {variant === "compact" ? <Text className="font-sans text-xs text-text-muted">{item.dateLabel}</Text> : null}
          </View>

          {onPress ? <MaterialCommunityIcons name="chevron-right" size={theme.icons.md} color={theme.colors.text.subtle} /> : null}
        </View>

        {variant === "detailed" && metaParts.length > 0 ? (
          <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>
            {metaParts.join(" • ")}
          </Text>
        ) : null}

        {variant === "detailed" && item.isPartial && typeof item.outstandingBefore === "number" && typeof item.outstandingAfter === "number" ? (
          <View className="flex-row items-center justify-between gap-3 rounded-lg bg-surface-raised px-3 py-3">
            <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={2}>
              {`Before: You get ${formatCurrency(item.outstandingBefore, currencyCode, locale)}`}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={theme.icons.sm} color={theme.colors.text.muted} />
            <Text className="min-w-0 flex-1 text-right font-sans text-xs text-text-muted" numberOfLines={2}>
              {`After: You get ${formatCurrency(item.outstandingAfter, currencyCode, locale)}`}
            </Text>
          </View>
        ) : null}

        {variant === "detailed" && item.remainingBalance != null ? (
          <Text className="font-sans text-xs font-semibold text-state-warning">
            {`Remaining balance ${formatCurrency(item.remainingBalance, currencyCode, locale)}`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
