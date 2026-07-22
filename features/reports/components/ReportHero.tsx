import { Text, View } from "react-native";

import { formatReportValue, pickHeroMetric, pickHeroSecondaryMetrics } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportMoneyCardApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface ReportHeroProps {
  cards: ReportMoneyCardApi[];
  currencyCode: CurrencyCode;
  locale: string;
  shared: boolean;
}

function valueToneClass(card: ReportMoneyCardApi | null) {
  if (!card) {
    return "text-text";
  }

  if (card.tone === "green") {
    return "text-state-success";
  }

  if (card.tone === "red") {
    return "text-state-danger";
  }

  return "text-text";
}

export function ReportHero({ cards, currencyCode, locale, shared }: ReportHeroProps) {
  const primary = pickHeroMetric(cards, shared);
  const secondary = pickHeroSecondaryMetrics(cards, shared);

  if (!primary) {
    return null;
  }

  return (
    <View className="gap-5 rounded-xl border border-surface-border bg-surface-raised p-5">
      <View className="gap-2">
        <Text className="font-sans text-sm text-text-muted">{primary.title}</Text>
        <Text
          adjustsFontSizeToFit
          className={cn("font-sans text-4xl font-semibold", valueToneClass(primary))}
          minimumFontScale={0.72}
          numberOfLines={1}
        >
          {formatReportValue(primary.value, primary.format, currencyCode, locale)}
        </Text>
        <Text className="font-sans text-sm text-text-muted">{primary.caption}</Text>
      </View>

      <View className="flex-row gap-3">
        {secondary.map((metric) => (
          <View key={metric.key} className="min-w-0 flex-1 gap-1">
            <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
              {metric.title}
            </Text>
            <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
              {formatReportValue(metric.value, metric.format, currencyCode, locale)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
