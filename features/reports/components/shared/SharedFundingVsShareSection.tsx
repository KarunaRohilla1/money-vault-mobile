import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatReportValue, reportNumber } from "@/features/reports/reportModel";
import { cn } from "@/lib/cn";
import type { ReportSharedParticipantFundingApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SharedFundingVsShareSectionProps {
  currencyCode: CurrencyCode;
  fundingVsShare?: ReportSharedParticipantFundingApi[] | null;
  locale: string;
}

export function SharedFundingVsShareSection({
  currencyCode,
  fundingVsShare = [],
  locale
}: SharedFundingVsShareSectionProps) {
  const participants = Array.isArray(fundingVsShare) ? fundingVsShare.filter(Boolean) : [];

  const maxAmount = Math.max(
    1,
    ...participants.map((p) => Math.max(reportNumber(p?.paidAmount), reportNumber(p?.shareAmount)))
  );

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Funding vs. Share</Text>
        <Text className="font-sans text-sm text-text-muted">Upfront cash funded vs. actual consumption per participant</Text>
      </View>

      {participants.length === 0 ? (
        <View className="rounded-xl border border-surface-border bg-surface p-4">
          <Text className="py-2 text-center font-sans text-sm text-text-muted">
            No participant funding data available for this cycle.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {participants.map((participant, index) => {
            const paidAmount = Math.max(0, reportNumber(participant?.paidAmount));
            const shareAmount = Math.max(0, reportNumber(participant?.shareAmount));
            const netDifference = typeof participant?.netDifference === "number" && Number.isFinite(participant.netDifference)
              ? participant.netDifference
              : Math.round((paidAmount - shareAmount) * 100) / 100;
            const paidPercent = Math.max(0, reportNumber(participant?.paidPercent));
            const sharePercent = Math.max(0, reportNumber(participant?.sharePercent));
            const isCurrentUser = Boolean(participant?.isCurrentUser);
            const participantName = participant?.name?.trim() || (isCurrentUser ? "You" : `Participant ${index + 1}`);

            const isFronted = netDifference > 0;
            const isCovered = netDifference < 0;

            const paidBarWidth = maxAmount > 0 && paidAmount > 0
              ? Math.min(100, Math.max(4, (paidAmount / maxAmount) * 100))
              : 0;
            const shareBarWidth = maxAmount > 0 && shareAmount > 0
              ? Math.min(100, Math.max(4, (shareAmount / maxAmount) * 100))
              : 0;

            const safeKey = participant?.vaultId != null
              ? `participant-${participant.vaultId}-${index}`
              : `participant-${index}`;

            return (
              <View
                className={cn(
                  "gap-3 rounded-xl border p-4",
                  isCurrentUser
                    ? "border-brand-soft/40 bg-surface-raised"
                    : "border-surface-border bg-surface"
                )}
                key={safeKey}
              >
                {/* Header: Name + Status Badge */}
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-deep">
                      <MaterialCommunityIcons
                        color={theme.colors.brand.soft}
                        name={isCurrentUser ? "account" : "account-outline"}
                        size={theme.icons.xs}
                      />
                    </View>
                    <Text className="font-sans text-sm font-bold text-text" numberOfLines={1}>
                      {participantName}
                    </Text>
                    {isCurrentUser ? (
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
                        ? `+${formatReportValue(netDifference, "money", currencyCode, locale)} fronted`
                        : isCovered
                        ? `${formatReportValue(Math.abs(netDifference), "money", currencyCode, locale)} covered`
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
                        Paid upfront ({paidPercent}%)
                      </Text>
                      <Text className="font-sans text-xs font-bold text-text tabular-nums">
                        {formatReportValue(paidAmount, "money", currencyCode, locale)}
                      </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                      <View
                        className="h-full rounded-full bg-brand"
                        style={{
                          width: `${paidBarWidth}%`
                        }}
                      />
                    </View>
                  </View>

                  {/* Share Row */}
                  <View className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-sans text-xs text-text-muted">
                        Actual share ({sharePercent}%)
                      </Text>
                      <Text className="font-sans text-xs font-bold text-accent-emerald tabular-nums">
                        {formatReportValue(shareAmount, "money", currencyCode, locale)}
                      </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                      <View
                        className="h-full rounded-full bg-accent-emerald"
                        style={{
                          width: `${shareBarWidth}%`
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
