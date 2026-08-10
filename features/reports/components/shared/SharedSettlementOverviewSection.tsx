import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import { settlementCardIcons, settlementToneClasses } from "@/features/reports/sharedReportModel";
import { cn } from "@/lib/cn";
import type { ReportSharedSettlementCardApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

interface SharedSettlementOverviewSectionProps {
  cards: ReportSharedSettlementCardApi[];
  currencyCode: CurrencyCode;
  locale: string;
}

export function SharedSettlementOverviewSection({ cards, currencyCode, locale }: SharedSettlementOverviewSectionProps) {
  return (
    <View className="gap-3">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Settlement Overview</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {cards.map((card) => (
          <SettlementCard card={card} currencyCode={currencyCode} key={card.key} locale={locale} />
        ))}
      </View>
    </View>
  );
}

function SettlementCard({ card, currencyCode, locale }: { card: ReportSharedSettlementCardApi; currencyCode: CurrencyCode; locale: string }) {
  const tone = settlementToneClasses(card.tone);
  const icon = settlementCardIcons[card.key as keyof typeof settlementCardIcons] ?? "chart-box-outline";

  return (
    <View className="min-h-32 basis-[48%] justify-between rounded-xl border border-surface-border bg-surface p-4">
      <View className={cn("h-10 w-10 items-center justify-center rounded-full", tone.icon)}>
        <MaterialCommunityIcons color={card.tone === "green" ? theme.colors.accent.emerald : card.tone === "blue" ? theme.colors.state.info : card.tone === "orange" ? theme.colors.accent.gold : theme.colors.brand.soft} name={icon as IconName} size={theme.icons.sm} />
      </View>
      <View className="gap-1">
        <Text className="font-sans text-sm text-text" numberOfLines={1}>{card.label}</Text>
        <Text adjustsFontSizeToFit className="font-sans text-2xl font-bold text-text tabular-nums" minimumFontScale={0.72} numberOfLines={1}>
          {formatReportValue(card.amount, "money", currencyCode, locale)}
        </Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>{card.caption}</Text>
      </View>
    </View>
  );
}
