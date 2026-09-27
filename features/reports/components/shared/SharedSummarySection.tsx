import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import type { ReportSharedSummaryApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SharedSummarySectionProps {
  currencyCode: CurrencyCode;
  locale: string;
  summary: ReportSharedSummaryApi;
}

export function SharedSummarySection({ currencyCode, locale, summary }: SharedSummarySectionProps) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Shared Spending Summary</Text>
        <Text className="font-sans text-sm text-text-muted">Household shared expenses and your personal obligation</Text>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {/* Total Shared Spend Card */}
        <View className="min-h-32 basis-[47%] flex-1 justify-between rounded-xl border border-surface-border bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-deep">
              <MaterialCommunityIcons color={theme.colors.brand.soft} name="account-group" size={theme.icons.xs} />
            </View>
            <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
              Total Shared Spend
            </Text>
          </View>
          <View className="gap-1">
            <Text adjustsFontSizeToFit className="font-sans text-2xl font-bold text-text tabular-nums" minimumFontScale={0.72} numberOfLines={1}>
              {formatReportValue(summary.totalSharedSpend, "money", currencyCode, locale)}
            </Text>
            <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
              {summary.transactionCount} {summary.transactionCount === 1 ? "shared transaction" : "shared transactions"}
            </Text>
          </View>
        </View>

        {/* My Share Card */}
        <View className="min-h-32 basis-[47%] flex-1 justify-between rounded-xl border border-surface-border bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-emerald/20">
              <MaterialCommunityIcons color={theme.colors.accent.emerald} name="account-check" size={theme.icons.xs} />
            </View>
            <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
              My Share
            </Text>
          </View>
          <View className="gap-1">
            <Text adjustsFontSizeToFit className="font-sans text-2xl font-bold text-text tabular-nums" minimumFontScale={0.72} numberOfLines={1}>
              {formatReportValue(summary.myShare, "money", currencyCode, locale)}
            </Text>
            <Text className="font-sans text-xs text-text-muted" numberOfLines={1}>
              {summary.mySharePercent}% of shared total
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

