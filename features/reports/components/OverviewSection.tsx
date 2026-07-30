import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { formatReportValue, orderedOverviewCards, reportSummaryCaption } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportMoneyCardApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const iconByKey: Record<string, IconName> = {
  income: "briefcase-outline",
  "cash-outflow": "arrow-top-right",
  "net-cost": "receipt-text-outline",
  savings: "piggy-bank-outline"
};

function toneClasses(tone: string) {
  if (tone === "red") {
    return { icon: "bg-accent-rose/20", text: "text-accent-rose" };
  }
  if (tone === "green") {
    return { icon: "bg-accent-emerald/20", text: "text-accent-emerald" };
  }
  return { icon: "bg-brand-deep", text: "text-brand-soft" };
}

export function OverviewSection({ cards, currencyCode, locale }: { cards: ReportMoneyCardApi[]; currencyCode: CurrencyCode; locale: string }) {
  const ordered = orderedOverviewCards(cards);
  return (
    <View className="gap-3">
      <Text className="font-sans text-sm font-bold uppercase text-text-muted">Overview</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {ordered.map((card) => (
          <OverviewCard card={card} currencyCode={currencyCode} key={card.key} locale={locale} />
        ))}
      </View>
    </View>
  );
}

function OverviewCard({ card, currencyCode, locale }: { card: ReportMoneyCardApi; currencyCode: CurrencyCode; locale: string }) {
  const tone = toneClasses(card.tone);
  const caption = reportSummaryCaption(card.caption);
  return (
    <View className="min-h-36 basis-[48%] justify-between rounded-xl border border-surface-border bg-surface p-4">
      <View className={cn("h-11 w-11 items-center justify-center rounded-full", tone.icon)}>
        <MaterialCommunityIcons name={iconByKey[card.key] ?? "chart-box-outline"} size={theme.icons.md} color={card.tone === "red" ? theme.colors.accent.rose : card.tone === "green" ? theme.colors.accent.emerald : theme.colors.brand.soft} />
      </View>
      <View className="gap-1">
        <Text className="font-sans text-sm text-text" numberOfLines={1}>{card.title}</Text>
        <Text className="font-sans text-2xl font-bold text-text tabular-nums" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{formatReportValue(card.value, card.format, currencyCode, locale)}</Text>
        {caption ? <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>{caption}</Text> : null}
      </View>
    </View>
  );
}