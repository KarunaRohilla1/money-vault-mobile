import { Text, View } from "react-native";

import { CategoryIcon } from "@/features/categories/components/CategoryIcon";
import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSharedCategoryBreakdownItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface SharedCategoryBreakdownSectionProps {
  categories: ReportSharedCategoryBreakdownItemApi[];
  currencyCode: CurrencyCode;
  locale: string;
}

export function SharedCategoryBreakdownSection({ categories, currencyCode, locale }: SharedCategoryBreakdownSectionProps) {
  const maxTotal = Math.max(1, ...categories.map((c) => c.totalAmount));

  return (
    <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Shared Category Breakdown</Text>
        <Text className="font-sans text-sm text-text-muted">Total shared spend by category and your personal share</Text>
      </View>

      {categories.length === 0 ? (
        <Text className="py-6 text-center font-sans text-sm text-text-muted">No shared category expenses recorded for this cycle.</Text>
      ) : (
        <View className="gap-3">
          {categories.map((item) => {
            const sharePercent = item.totalAmount > 0 ? Math.round((item.myShareAmount / item.totalAmount) * 100) : 0;

            return (
              <View className="gap-2 border-b border-surface-border/70 pb-3 last:border-b-0 last:pb-0" key={item.key}>
                <View className="flex-row items-center gap-3">
                  <CategoryIcon emoji={item.icon} size="sm" />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="font-sans text-xs text-text-muted">
                      {item.percent}% of shared total
                    </Text>
                  </View>

                  <View className="items-end gap-0.5">
                    <Text className="font-sans text-sm font-bold text-text tabular-nums">
                      {formatReportValue(item.totalAmount, "money", currencyCode, locale)}
                    </Text>
                    <Text className="font-sans text-xs font-semibold text-accent-emerald tabular-nums">
                      My share: {formatReportValue(item.myShareAmount, "money", currencyCode, locale)} ({sharePercent}%)
                    </Text>
                  </View>
                </View>

                {/* Progress bar showing total bar & share inside */}
                <View className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                  <View
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${Math.min(100, Math.max(4, (item.totalAmount / maxTotal) * 100))}%`
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
