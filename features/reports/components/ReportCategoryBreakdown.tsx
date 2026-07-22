import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatReportValue, topCategories, type ReportCategoryMetric } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportCategoryItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface ReportCategoryBreakdownProps {
  cashRows: ReportCategoryItemApi[];
  currencyCode: CurrencyCode;
  locale: string;
  metric: ReportCategoryMetric;
  netRows: ReportCategoryItemApi[];
  onMetricChange: (metric: ReportCategoryMetric) => void;
  shared: boolean;
}

function metricTitle(metric: ReportCategoryMetric) {
  if (metric === "netPersonalCost") {
    return "Personal Cost";
  }

  if (metric === "householdSpending") {
    return "Household Spending";
  }

  return "Cash Outflow";
}

export function ReportCategoryBreakdown({
  cashRows,
  currencyCode,
  locale,
  metric,
  netRows,
  onMetricChange,
  shared
}: ReportCategoryBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = shared || metric === "cashOutflow" ? cashRows : netRows;
  const visibleRows = topCategories(rows, expanded);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-lg font-semibold text-text">Where money went</Text>
          <Text className="font-sans text-sm text-text-muted">{metricTitle(shared ? "householdSpending" : metric)}</Text>
        </View>
        {shared ? null : (
          <View className="flex-row rounded-full bg-background-muted p-1">
            <SegmentButton label="Cash" selected={metric === "cashOutflow"} onPress={() => onMetricChange("cashOutflow")} />
            <SegmentButton label="Cost" selected={metric === "netPersonalCost"} onPress={() => onMetricChange("netPersonalCost")} />
          </View>
        )}
      </View>

      {rows.length === 0 ? (
        <EmptyState icon="chart-donut" title="No category spending" message="No qualifying category rows for this cycle." />
      ) : (
        <View className="gap-4 rounded-xl bg-surface p-4">
          <View className="flex-row items-end justify-between gap-3">
            <View className="gap-1">
              <Text className="font-sans text-xs text-text-muted">Total</Text>
              <Text className="font-sans text-xl font-semibold text-text" adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1}>
                {formatReportValue(total, "money", currencyCode, locale)}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            {visibleRows.map((row, index) => (
              <View key={row.key} className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-background-muted">
                  <Text className="font-sans text-sm">{row.icon}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                    {index + 1}. {row.name}
                  </Text>
                  <Text className="font-sans text-xs text-text-muted">{row.percent}% of total</Text>
                </View>
                <Text className="max-w-28 text-right font-sans text-sm font-semibold text-text" adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1}>
                  {formatReportValue(row.amount, "money", currencyCode, locale)}
                </Text>
              </View>
            ))}
          </View>

          {rows.length > 5 ? (
            <Pressable accessibilityRole="button" className="min-h-11 justify-center self-start" onPress={() => setExpanded((value) => !value)}>
              <Text className="font-sans text-sm font-semibold text-brand-soft">{expanded ? "Show top 5" : "View all categories"}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

function SegmentButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityLabel={`Show ${label} category report`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      className={cn("min-h-9 justify-center rounded-full px-4", selected ? "bg-brand" : "bg-transparent")}
      onPress={onPress}
    >
      <Text className={cn("font-sans text-xs font-semibold", selected ? "text-text" : "text-text-muted")}>{label}</Text>
    </Pressable>
  );
}
