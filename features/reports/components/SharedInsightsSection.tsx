import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportReviewItemApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const iconByKey: Record<string, IconName> = {
  "paid-by-you": "arrow-top-right",
  "received-by-you": "arrow-down",
  "you-owe": "account-group",
  "you-are-owed": "arrow-top-right",
  "settlements-completed": "check-circle-outline",
  "settlements-pending": "clock-outline"
};

export function SharedInsightsSection({ currencyCode, insights, locale }: { currencyCode: CurrencyCode; insights: ReportReviewItemApi[]; locale: string }) {
  return (
    <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Shared Insights</Text>
      {insights.length === 0 ? (
        <EmptyState icon="account-group-outline" title="No shared activity" message="No shared activity was returned for this cycle." />
      ) : (
        <View className="flex-row flex-wrap gap-2.5">
          {insights.map((item) => (
            <View key={item.key} className="min-h-24 basis-[48%] flex-row items-start gap-3 rounded-lg border border-surface-border bg-background-muted p-3">
              <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-lg bg-brand-deep">
                <MaterialCommunityIcons name={iconByKey[item.key] ?? "chart-box-outline"} size={theme.icons.sm} color={theme.colors.brand.soft} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans text-xs leading-4 text-text-muted" numberOfLines={2}>{item.label}</Text>
                <Text className="font-sans text-base font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatReportValue(item.value, item.format, currencyCode, locale)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
