import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { ChartDataItem } from "@/features/reports/analytics/analyticsAdapter";
import { formatAnalyticsDateLabel, trendMaximum } from "@/features/reports/analytics/analyticsAdapter";
import { formatReportValue } from "@/features/reports/reportModel";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

export function TrendSection({ currencyCode, locale, points, title }: { currencyCode: CurrencyCode; locale: string; points: { amount: number; date: string; label: string }[]; title: string }) {
  const max = trendMaximum(points);
  const visible = points.slice(-14);
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="min-w-0 flex-1 font-sans text-sm font-bold uppercase text-brand-soft" numberOfLines={1}>{title}</Text>
        {points.length > 0 ? <Text className="font-sans text-xs text-text-muted">Daily</Text> : null}
      </View>
      {points.length === 0 ? <Text className="py-8 text-center font-sans text-sm text-text-muted">No trend data.</Text> : (
        <View className="gap-3" accessibilityLabel={`Trend chart. Highest value ${formatReportValue(max, "money", currencyCode, locale)}.`}>
          <View className="h-36 flex-row items-end gap-1 border-b border-surface-border px-1">
            {visible.map((point) => <View className="min-w-0 flex-1 rounded-t-full bg-brand" key={point.date} style={{ height: Math.max(2, (point.amount / max) * 132) }} />)}
          </View>
          <View className="flex-row justify-between">
            <Text className="font-sans text-xs text-text-muted">{formatAnalyticsDateLabel(visible[0]?.date, locale) ?? ""}</Text>
            <Text className="font-sans text-xs text-text-muted">{formatAnalyticsDateLabel(visible[visible.length - 1]?.date, locale) ?? ""}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function BreakdownSection({ currencyCode, locale, onSelect, rows, title }: { currencyCode: CurrencyCode; locale: string; onSelect: (key: string) => void; rows: ChartDataItem[]; title: string }) {
  return (
    <View className="gap-2 rounded-xl border border-surface-border bg-surface p-4">
      <Text className="mb-2 font-sans text-sm font-bold uppercase text-brand-soft">{title}</Text>
      {rows.length === 0 ? <Text className="py-8 text-center font-sans text-sm text-text-muted">No rows to show.</Text> : null}
      {rows.map((row) => (
        <Pressable accessibilityRole="button" className="flex-row items-center gap-3 border-b border-surface-border/70 py-2 last:border-b-0" key={row.key} onPress={() => onSelect(row.key)}>
          <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: row.color }}>
            <MaterialCommunityIcons name={row.iconName} size={theme.icons.sm} color={theme.colors.text.DEFAULT} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>{row.label}</Text>
            <Text className="font-sans text-xs text-text-muted">{row.transactionCount} transactions</Text>
          </View>
          <View className="items-end">
            <Text className="font-sans text-sm font-bold text-text tabular-nums">{formatReportValue(row.amount, "money", currencyCode, locale)}</Text>
            <Text className="font-sans text-xs text-text-muted">{row.percent}%</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
