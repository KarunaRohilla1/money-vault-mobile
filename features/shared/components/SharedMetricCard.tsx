import type { ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import { theme } from "@/theme";

type MetricTone = "brand" | "green" | "blue";

const toneMap: Record<MetricTone, { bg: string; color: string; icon: ComponentProps<typeof MaterialCommunityIcons>["name"] }> = {
  blue: { bg: "bg-state-info/20", color: theme.colors.state.info, icon: "history" },
  brand: { bg: "bg-brand-deep", color: theme.colors.brand.soft, icon: "briefcase-outline" },
  green: { bg: "bg-accent-emerald/20", color: theme.colors.accent.emerald, icon: "scale-balance" }
};

export function SharedMetricCard({
  currencyCode,
  label,
  locale,
  tone,
  value,
  valueIsCurrency = true
}: {
  currencyCode: string;
  label: string;
  locale: string;
  tone: MetricTone;
  value: number;
  valueIsCurrency?: boolean;
}) {
  const toneStyles = toneMap[tone];

  return (
    <View className={`${dashboardLayout.cardClassName} min-h-32 flex-1 gap-3 p-4`}>
      <View className={`h-10 w-10 items-center justify-center rounded-lg ${toneStyles.bg}`}>
        <MaterialCommunityIcons name={toneStyles.icon} size={theme.icons.sm} color={toneStyles.color} />
      </View>
      <View className="gap-1">
        <Text className="font-sans text-xs text-text-muted" numberOfLines={2}>
          {label}
        </Text>
        {valueIsCurrency ? (
          <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="font-sans text-2xl font-bold text-text" />
        ) : (
          <Text className="font-sans text-2xl font-bold text-text">{value}</Text>
        )}
      </View>
    </View>
  );
}

export function SharedMetricsRow({
  currencyCode,
  locale,
  metrics
}: {
  currencyCode: string;
  locale: string;
  metrics: {
    outstandingBalance: number;
    settlementsCount: number;
    sharedSpend: number;
  };
}) {
  return (
    <View className="flex-row gap-3">
      <SharedMetricCard currencyCode={currencyCode} label="Shared Spend" locale={locale} tone="brand" value={metrics.sharedSpend} />
      <SharedMetricCard currencyCode={currencyCode} label="Outstanding Balance" locale={locale} tone="green" value={metrics.outstandingBalance} />
      <SharedMetricCard currencyCode={currencyCode} label="Settlements" locale={locale} tone="blue" value={metrics.settlementsCount} valueIsCurrency={false} />
    </View>
  );
}
