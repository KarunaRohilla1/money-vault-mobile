import { Text, View } from "react-native";

import { CategoryIcon } from "@/features/categories/components/CategoryIcon";
import { formatReportValue, reportNumber } from "@/features/reports/reportModel";
import type { ReportSharedCategoryBreakdownItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface SharedCategoryBreakdownSectionProps {
  categories?: ReportSharedCategoryBreakdownItemApi[] | null;
  currencyCode: CurrencyCode;
  locale: string;
}

export function SharedCategoryBreakdownSection({
  categories = [],
  currencyCode,
  locale
}: SharedCategoryBreakdownSectionProps) {
  const items = Array.isArray(categories) ? categories.filter(Boolean) : [];
  const maxTotal = Math.max(1, ...items.map((c) => reportNumber(c?.totalAmount)));

  return (
    <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Shared Category Breakdown</Text>
        <Text className="font-sans text-sm text-text-muted">Total shared spend by category and your personal share</Text>
      </View>

      {items.length === 0 ? (
        <Text className="py-6 text-center font-sans text-sm text-text-muted">No shared category expenses recorded for this cycle.</Text>
      ) : (
        <View className="gap-3">
          {items.map((item, index) => {
            const totalAmount = Math.max(0, reportNumber(item?.totalAmount));
            const myShareAmount = Math.max(0, reportNumber(item?.myShareAmount));
            const sharePercent = totalAmount > 0 ? Math.round((myShareAmount / totalAmount) * 100) : 0;
            const itemPercent = Math.max(0, reportNumber(item?.percent));
            const categoryName = item?.name?.trim() || "Uncategorized";
            const categoryIcon = item?.icon || "🏷️";
            const barWidth = maxTotal > 0 && totalAmount > 0 ? Math.min(100, Math.max(4, (totalAmount / maxTotal) * 100)) : 0;
            const safeKey = item?.key || `cat-${index}`;

            return (
              <View className="gap-2 border-b border-surface-border/70 pb-3 last:border-b-0 last:pb-0" key={safeKey}>
                <View className="flex-row items-center gap-3">
                  <CategoryIcon emoji={categoryIcon} size="sm" />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                      {categoryName}
                    </Text>
                    <Text className="font-sans text-xs text-text-muted">
                      {itemPercent}% of shared total
                    </Text>
                  </View>

                  <View className="items-end gap-0.5">
                    <Text className="font-sans text-sm font-bold text-text tabular-nums">
                      {formatReportValue(totalAmount, "money", currencyCode, locale)}
                    </Text>
                    <Text className="font-sans text-xs font-semibold text-accent-emerald tabular-nums">
                      My share: {formatReportValue(myShareAmount, "money", currencyCode, locale)} ({sharePercent}%)
                    </Text>
                  </View>
                </View>

                {/* Progress bar showing total bar & share inside */}
                <View className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                  <View
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${barWidth}%`
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
