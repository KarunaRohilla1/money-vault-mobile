import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatReportValue } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportSharedParticipantFundingApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SharedFundingVsShareSectionProps {
  currencyCode: CurrencyCode;
  fundingVsShare: ReportSharedParticipantFundingApi[];
  locale: string;
}

export function SharedFundingVsShareSection({ currencyCode, fundingVsShare, locale }: SharedFundingVsShareSectionProps) {
  const maxAmount = Math.max(
    1,
    ...fundingVsShare.map((p) => Math.max(p.paidAmount, p.shareAmount))
  );

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Funding vs. Share</Text>
        <Text className="font-sans text-sm text-text-muted">Upfront cash funded vs. actual consumption per participant</Text>
      </View>

      <View className="gap-3">
        {fundingVsShare.map((participant) => {
          const isFronted = participant.netDifference > 0;
          const isCovered = participant.netDifference < 0;

          return (
            <View
              className={cn(
                "gap-3 rounded-xl border p-4",
                participant.isCurrentUser
                  ? "border-brand-soft/40 bg-surface-raised"
                  : "border-surface-border bg-surface"
              )}
              key={participant.vaultId}
            >
              {/* Header: Name + Status Badge */}
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-deep">
                    <MaterialCommunityIcons
                      color={theme.colors.brand.soft}
                      name={participant.isCurrentUser ? "account" : "account-outline"}
                      size={theme.icons.xs}
                    />
                  </View>
                  <Text className="font-sans text-sm font-bold text-text" numberOfLines={1}>
                    {participant.name}
                  </Text>
                  {participant.isCurrentUser ? (
                    <View className="rounded bg-brand-muted px-1.5 py-0.5">
                      <Text className="font-sans text-[10px] font-semibold text-brand-soft">YOU</Text>
                    </View>
                  ) : null}
                </View>

                {/* Net Difference Badge */}
                <View
                  className={cn(
                    "flex-row items-center gap-1 rounded-full px-2.5 py-1",
                    isFronted
                      ? "bg-accent-emerald/20"
                      : isCovered
                      ? "bg-brand-muted"
                      : "bg-surface-border"
                  )}
                >
                  <MaterialCommunityIcons
                    color={
                      isFronted
                        ? theme.colors.accent.emerald
                        : isCovered
                        ? theme.colors.brand.soft
                        : theme.colors.text.muted
                    }
                    name={isFronted ? "arrow-top-right" : isCovered ? "account-arrow-left-outline" : "check"}
                    size={theme.icons.xs}
                  />
                  <Text
                    className={cn(
                      "font-sans text-xs font-semibold tabular-nums",
                      isFronted
                        ? "text-accent-emerald"
                        : isCovered
                        ? "text-brand-soft"
                        : "text-text-muted"
                    )}
                  >
                    {isFronted
                      ? `+${formatReportValue(participant.netDifference, "money", currencyCode, locale)} fronted`
                      : isCovered
                      ? `${formatReportValue(Math.abs(participant.netDifference), "money", currencyCode, locale)} covered`
                      : "Balanced"}
                  </Text>
                </View>
              </View>

              {/* Comparison Bars */}
              <View className="gap-2">
                {/* Paid Row */}
                <View className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-xs text-text-muted">
                      Paid upfront ({participant.paidPercent}%)
                    </Text>
                    <Text className="font-sans text-xs font-bold text-text tabular-nums">
                      {formatReportValue(participant.paidAmount, "money", currencyCode, locale)}
                    </Text>
                  </View>
                  <View className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                    <View
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.min(100, Math.max(4, (participant.paidAmount / maxAmount) * 100))}%`
                      }}
                    />
                  </View>
                </View>

                {/* Share Row */}
                <View className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans text-xs text-text-muted">
                      Actual share ({participant.sharePercent}%)
                    </Text>
                    <Text className="font-sans text-xs font-bold text-accent-emerald tabular-nums">
                      {formatReportValue(participant.shareAmount, "money", currencyCode, locale)}
                    </Text>
                  </View>
                  <View className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                    <View
                      className="h-full rounded-full bg-accent-emerald"
                      style={{
                        width: `${Math.min(100, Math.max(4, (participant.shareAmount / maxAmount) * 100))}%`
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
