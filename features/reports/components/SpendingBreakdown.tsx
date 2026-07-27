import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { selectedDistributionItem, spendingTotal } from "@/features/reports/adapter";
import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSpendingDistributionItemApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

export function SpendingBreakdown({ currencyCode, locale, onSelect, rows, selectedKey, title }: {
  currencyCode: CurrencyCode;
  locale: string;
  onSelect: (key: string) => void;
  rows: ReportSpendingDistributionItemApi[];
  selectedKey: string | null;
  title: string;
}) {
  const selected = selectedDistributionItem(rows, selectedKey);
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">{title}</Text>
        <Text className="font-sans text-sm font-semibold text-brand-soft">View details ›</Text>
      </View>
      {rows.length === 0 ? (
        <Text className="py-8 text-center font-sans text-sm text-text-muted">No spending this cycle.</Text>
      ) : (
        <View className="gap-4">
          <CategoryDonutChart currencyCode={currencyCode} locale={locale} rows={rows} selected={selected} />
          <CategoryLegend currencyCode={currencyCode} locale={locale} onSelect={onSelect} rows={rows} selectedKey={selected?.key ?? null} />
        </View>
      )}
    </View>
  );
}

export function CategoryDonutChart({ currencyCode, locale, rows, selected }: {
  currencyCode: CurrencyCode;
  locale: string;
  rows: ReportSpendingDistributionItemApi[];
  selected: ReportSpendingDistributionItemApi | null;
}) {
  const total = spendingTotal(rows);
  const radius = 54;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  const lengths = rows.map((row) => (total ? (row.amount / total) * circumference : 0));
  const offsets = lengths.map((_length, index) => lengths.slice(0, index).reduce((sum, length) => sum + length, 0));
  return (
    <View accessibilityLabel={rows.map((row) => `${row.name} accounts for ${row.percent} percent of spending`).join(". ")} className="items-center justify-center py-2">
      <Svg width={164} height={164} viewBox="0 0 140 140">
        <Circle cx="70" cy="70" r={radius} stroke={theme.colors.background.muted} strokeWidth={strokeWidth} fill="none" />
        {rows.map((row, index) => {
          const length = lengths[index] ?? 0;
          const segmentOffset = offsets[index] ?? 0;
          return (
            <Circle
              key={row.key}
              cx="70"
              cy="70"
              r={radius}
              stroke={row.color}
              strokeWidth={selected?.key === row.key ? strokeWidth + 3 : strokeWidth}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-segmentOffset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
            />
          );
        })}
      </Svg>
      <View className="absolute items-center">
        <Text className="font-sans text-xl font-bold text-text">{formatReportValue(selected?.amount ?? total, "money", currencyCode, locale)}</Text>
        <Text className="font-sans text-xs text-text-muted">{selected ? `${selected.percent}%` : "Total"}</Text>
      </View>
    </View>
  );
}

export function CategoryLegend({ currencyCode, locale, onSelect, rows, selectedKey }: {
  currencyCode: CurrencyCode;
  locale: string;
  onSelect: (key: string) => void;
  rows: ReportSpendingDistributionItemApi[];
  selectedKey: string | null;
}) {
  return (
    <View className="gap-1">
      {rows.map((row) => (
        <Pressable
          accessibilityLabel={`${row.name}, ${formatReportValue(row.amount, "money", currencyCode, locale)}, ${row.percent} percent`}
          accessibilityRole="button"
          className={`flex-row items-center gap-3 rounded-lg px-2 py-2 ${selectedKey === row.key ? "bg-background-muted" : "bg-transparent"}`}
          key={row.key}
          onPress={() => onSelect(row.key)}
        >
          <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: row.color }} />
          <Text className="w-6 text-center font-sans text-sm text-text-muted">{row.icon}</Text>
          <Text className="min-w-0 flex-1 font-sans text-sm text-text" numberOfLines={1}>{row.name}</Text>
          <Text className="font-sans text-sm font-semibold text-text tabular-nums">{formatReportValue(row.amount, "money", currencyCode, locale)}</Text>
          <Text className="w-10 text-right font-sans text-sm text-text-muted">{row.percent}%</Text>
          <MaterialCommunityIcons name="chevron-right" size={theme.icons.xs} color={theme.colors.text.muted} />
        </Pressable>
      ))}
    </View>
  );
}
