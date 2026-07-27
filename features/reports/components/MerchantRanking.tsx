import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSpendingDistributionItemApi, ReportSpendingMerchantItemApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

export function MerchantRanking({ currencyCode, distributionRows, locale, merchants, title }: {
  currencyCode: CurrencyCode;
  distributionRows: ReportSpendingDistributionItemApi[];
  locale: string;
  merchants?: ReportSpendingMerchantItemApi[] | undefined;
  title: string;
}) {
  const rows = merchants ?? distributionRows.slice(0, 5).map((row, index) => ({
    amount: row.amount,
    category: row.name,
    id: row.id,
    logo: null,
    name: row.name,
    percent: row.percent,
    rank: index + 1
  }));
  return (
    <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">{title}</Text>
        <Text className="font-sans text-sm font-semibold text-brand-soft">View all ›</Text>
      </View>
      {rows.length === 0 ? <Text className="py-8 text-center font-sans text-sm text-text-muted">No merchants this cycle.</Text> : null}
      {rows.map((row) => <MerchantRow currencyCode={currencyCode} key={`${row.id}:${row.rank}`} locale={locale} row={row} />)}
    </View>
  );
}

export function MerchantRow({ currencyCode, locale, row }: { currencyCode: CurrencyCode; locale: string; row: ReportSpendingMerchantItemApi }) {
  const initials = row.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View accessibilityLabel={`${row.rank}. ${row.name}, ${formatReportValue(row.amount, "money", currencyCode, locale)}, ${row.percent} percent`} className="flex-row items-center gap-3 border-b border-surface-border/70 py-2 last:border-b-0">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-surface-pressed">
        <Text className="font-sans text-xs font-bold text-text-muted">{row.rank}</Text>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-deep">
        <Text className="font-sans text-sm font-bold text-text">{initials}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>{row.name}</Text>
        <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>{row.category}</Text>
      </View>
      <View className="items-end">
        <Text className="font-sans text-base font-bold text-text tabular-nums">{formatReportValue(row.amount, "money", currencyCode, locale)}</Text>
        <Text className="font-sans text-xs text-text-muted">{row.percent}%</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={theme.icons.xs} color={theme.colors.text.muted} />
    </View>
  );
}
