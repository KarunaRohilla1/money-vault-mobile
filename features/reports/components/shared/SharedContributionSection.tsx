import { Text, View } from "react-native";

import type { ChartDataItem } from "@/features/reports/analytics/analyticsAdapter";
import { VisualizationSection } from "@/features/reports/analytics/components/VisualizationSection";
import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSharedContributionApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface SharedContributionSectionProps {
  contribution: ReportSharedContributionApi;
  currencyCode: CurrencyCode;
  locale: string;
}

export function SharedContributionSection({ contribution, currencyCode, locale }: SharedContributionSectionProps) {
  const items: ChartDataItem[] = contribution.items.map((item) => ({
    amount: item.amount,
    color: item.color,
    icon: "label",
    iconName: item.key === "you" ? "account-outline" : "account-group-outline",
    id: item.key,
    key: item.key,
    label: item.label,
    percent: item.percent,
    transactionCount: 0
  }));

  return (
    <View className="gap-3">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Contribution Breakdown</Text>
      <VisualizationSection
        currencyCode={currencyCode}
        items={items}
        locale={locale}
        onSelect={() => undefined}
        selectedKey={null}
        title="Shared expense contributions"
        total={contribution.total}
        type="donut"
      />
      <View className="flex-row flex-wrap gap-2.5">
        {contribution.items.map((item) => (
          <View className="min-w-0 basis-[48%] flex-row items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2" key={item.key}>
            <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans text-sm font-semibold text-text">{item.label}</Text>
              <Text className="font-sans text-xs text-text-muted">{item.percent}%</Text>
            </View>
            <Text className="font-sans text-sm font-bold text-text tabular-nums">{formatReportValue(item.amount, "money", currencyCode, locale)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
