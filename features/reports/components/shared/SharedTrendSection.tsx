import { Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportSharedTrendPointApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface SharedTrendSectionProps {
  currencyCode: CurrencyCode;
  locale: string;
  trend: ReportSharedTrendPointApi[];
}

export function SharedTrendSection({ currencyCode, locale, trend }: SharedTrendSectionProps) {
  const max = Math.max(1, ...trend.map((point) => Math.max(point.totalSharedSpend, point.myShare)));

  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="min-w-0 flex-1 font-sans text-sm font-bold uppercase text-brand-soft" numberOfLines={1}>
            6-Cycle Shared Spending Trend
          </Text>
          <Text className="font-sans text-xs text-text-muted">Past 6 cycles</Text>
        </View>

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full bg-brand" />
            <Text className="font-sans text-xs text-text-muted">Total Shared</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full bg-accent-emerald" />
            <Text className="font-sans text-xs text-text-muted">My Share</Text>
          </View>
        </View>
      </View>

      {trend.length === 0 ? (
        <Text className="py-8 text-center font-sans text-sm text-text-muted">No trend data available.</Text>
      ) : (
        <View
          accessibilityLabel={`Shared spending trend chart. Highest value ${formatReportValue(max, "money", currencyCode, locale)}.`}
          className="gap-3"
        >
          <View className="h-40 flex-row items-end justify-between border-b border-surface-border px-1 pb-1 pt-4">
            {trend.map((point, index) => {
              const totalHeight = Math.max(3, (point.totalSharedSpend / max) * 128);
              const myShareHeight = Math.max(3, (point.myShare / max) * 128);

              return (
                <View className="flex-1 items-center gap-1 px-1" key={`${point.cycle}-${index}`}>
                  <View className="h-32 w-full flex-row items-end justify-center gap-1">
                    {/* Total Shared Spend Bar */}
                    <View
                      className="w-[42%] min-w-1.5 rounded-t-sm bg-brand"
                      style={{ height: totalHeight }}
                    />
                    {/* My Share Bar */}
                    <View
                      className="w-[42%] min-w-1.5 rounded-t-sm bg-accent-emerald"
                      style={{ height: myShareHeight }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Cycle Range Labels */}
          <View className="flex-row justify-between px-1">
            <Text className="font-sans text-[11px] text-text-muted">
              {trend[0]?.cycle ?? ""}
            </Text>
            <Text className="font-sans text-[11px] text-text-muted">
              {trend[trend.length - 1]?.cycle ?? ""}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
