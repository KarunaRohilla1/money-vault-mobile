import { Text, View } from "react-native";

import { CategoryIcon } from "@/features/categories/components/CategoryIcon";
import { formatReportValue } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportSharedCategoryImpactItemApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface SharedCategoryImpactSectionProps {
  currencyCode: CurrencyCode;
  locale: string;
  rows: ReportSharedCategoryImpactItemApi[];
}

export function SharedCategoryImpactSection({ currencyCode, locale, rows }: SharedCategoryImpactSectionProps) {
  const maxAmount = Math.max(1, ...rows.map((row) => Math.max(row.actualAmount, row.projectedAmount)));

  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Settlement Impact by Category</Text>
        <View className="flex-row items-center gap-4">
          <Legend color="bg-brand" label="Actual" />
          <Legend color="bg-accent-emerald" label="After Settlement" />
        </View>
      </View>

      <View className="gap-4">
        {rows.map((row) => (
          <View className="gap-2" key={row.key}>
            <View className="flex-row items-center gap-3">
              <CategoryIcon emoji={row.icon} size="sm" />
              <Text className="min-w-0 flex-1 font-sans text-sm font-semibold text-text" numberOfLines={1}>{row.name}</Text>
              <Text className={cn("font-sans text-xs font-semibold tabular-nums", row.difference > 0 ? "text-accent-emerald" : row.difference < 0 ? "text-accent-rose" : "text-text-muted")}>
                {formatReportValue(row.difference, "money", currencyCode, locale)}
              </Text>
            </View>
            <DualBar actual={row.actualAmount} currencyCode={currencyCode} locale={locale} maxAmount={maxAmount} projected={row.projectedAmount} />
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
    </View>
  );
}

function DualBar({ actual, currencyCode, locale, maxAmount, projected }: { actual: number; currencyCode: CurrencyCode; locale: string; maxAmount: number; projected: number }) {
  return (
    <View className="gap-1.5">
      <BarRow amount={actual} colorClass="bg-brand" currencyCode={currencyCode} label="Actual" locale={locale} maxAmount={maxAmount} />
      <BarRow amount={projected} colorClass="bg-accent-emerald" currencyCode={currencyCode} label="Projected" locale={locale} maxAmount={maxAmount} />
    </View>
  );
}

function BarRow({ amount, colorClass, currencyCode, label, locale, maxAmount }: { amount: number; colorClass: string; currencyCode: CurrencyCode; label: string; locale: string; maxAmount: number }) {
  return (
    <View className="flex-row items-center gap-3">
      <Text className="w-14 font-sans text-[10px] text-text-muted">{label}</Text>
      <View className="h-2.5 flex-1 rounded-full bg-background-muted">
        <View className={cn("h-2.5 rounded-full", colorClass)} style={{ width: `${Math.max(4, (amount / maxAmount) * 100)}%` }} />
      </View>
      <Text className="w-20 text-right font-sans text-[10px] font-semibold text-text tabular-nums">{formatReportValue(amount, "money", currencyCode, locale)}</Text>
    </View>
  );
}
