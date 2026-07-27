import type { ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { closeCycleItemCountLabel } from "@/features/planning/closeCycleUi";
import type { CloseCycleSummary } from "@/features/planning/closeCyclePresentation";
import { theme } from "@/theme";

interface CloseCycleLiveSummaryProps {
  currencyCode: string;
  locale: string;
  summary: CloseCycleSummary;
}

export function CloseCycleLiveSummary({ currencyCode, locale, summary }: CloseCycleLiveSummaryProps) {
  return (
    <View className="gap-3">
      <Text className="font-sans text-xl font-semibold text-text">Summary (Live)</Text>
      <View className="flex-row flex-wrap gap-3">
        <SummaryCard currencyCode={currencyCode} icon="check-circle-outline" label="Paid / Received" locale={locale} tone="success" value={summary.paidOrReceived} />
        <SummaryCard currencyCode={currencyCode} icon="close-circle-outline" label="Cancelled / Skipped" locale={locale} tone="danger" value={summary.cancelled} />
        <SummaryCard currencyCode={currencyCode} icon="arrow-right-top" label="Carry Forward" locale={locale} tone="brand" value={summary.carried} />
        <View className="min-w-[46%] flex-1 gap-1.5 rounded-lg bg-surface px-3 py-2.5">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="format-list-bulleted" size={theme.icons.sm} color={theme.colors.brand.soft} />
            <Text className="min-w-0 flex-1 font-sans text-xs font-semibold text-text-muted">Total Items</Text>
          </View>
          <Text className="font-sans text-lg font-semibold text-text">{summary.total}</Text>
          <Text className="font-sans text-xs text-text-muted">{closeCycleItemCountLabel(summary.total)}</Text>
        </View>
      </View>
    </View>
  );
}

function SummaryCard({ currencyCode, icon, label, locale, tone, value }: { currencyCode: string; icon: ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string; locale: string; tone: "brand" | "danger" | "success"; value: { amount: number; count: number } }) {
  return (
    <View className="min-w-[46%] flex-1 gap-1.5 rounded-lg bg-surface px-3 py-2.5">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={summaryIconColor(tone)} />
        <Text className="min-w-0 flex-1 font-sans text-xs font-semibold text-text-muted">{label}</Text>
      </View>
      <Text className="font-sans text-sm text-text">{closeCycleItemCountLabel(value.count)}</Text>
      <CurrencyText value={value.amount} currencyCode={currencyCode} locale={locale} className={summaryAmountClass(tone)} />
    </View>
  );
}

function summaryIconColor(tone: "brand" | "danger" | "success") {
  if (tone === "success") return theme.colors.state.success;
  if (tone === "danger") return theme.colors.accent.rose;
  return theme.colors.brand.soft;
}

function summaryAmountClass(tone: "brand" | "danger" | "success") {
  if (tone === "success") return "text-sm font-semibold text-state-success";
  if (tone === "danger") return "text-sm font-semibold text-accent-rose";
  return "text-sm font-semibold text-brand-soft";
}
