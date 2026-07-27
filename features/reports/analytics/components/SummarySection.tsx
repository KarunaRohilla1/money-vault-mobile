import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { AnalyticsSummaryCardModel } from "@/features/reports/analytics/analyticsAdapter";
import { formatReportValue } from "@/features/reports/reportModel";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

export function SummarySection({ currencyCode, locale, question, summary }: { currencyCode: CurrencyCode; locale: string; question: string; summary: AnalyticsSummaryCardModel[] }) {
  return (
    <View className="rounded-xl border border-surface-border bg-surface p-4">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Spending Summary</Text>
      <Text className="mt-1 font-sans text-sm text-text-muted">{question}</Text>
      <View className="mt-4 flex-row flex-wrap gap-3">
        {summary.map((metric) => <SummaryCard currencyCode={currencyCode} key={metric.key} locale={locale} metric={metric} />)}
      </View>
    </View>
  );
}

function SummaryCard({ currencyCode, locale, metric }: { currencyCode: CurrencyCode; locale: string; metric: AnalyticsSummaryCardModel }) {
  return (
    <View className="min-w-[46%] flex-1 gap-2 rounded-lg bg-background-muted p-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-deep">
        <MaterialCommunityIcons name="chart-box-outline" size={theme.icons.xs} color={theme.colors.brand.soft} />
      </View>
      <Text className="font-sans text-sm text-text-muted">{metric.title}</Text>
      <Text className="font-sans text-2xl font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatReportValue(metric.value, metric.format, currencyCode, locale)}</Text>
      <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>{metric.caption}</Text>
    </View>
  );
}
