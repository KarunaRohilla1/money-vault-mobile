import { Text, View } from "react-native";

import { CurrencyText, SecondaryButton } from "@/components/ui";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import type { SharedSettlementSummary } from "@/features/shared/sharedDashboardModel";
import { cn } from "@/lib/cn";

function settlementHeading(summary: SharedSettlementSummary) {
  if (summary.settlementState === "settled" || summary.outstandingBalance <= 0) {
    return {
      amount: null as number | null,
      amountTone: "text-text",
      title: "All settled 🎉",
      supporting: "Nobody owes anyone."
    };
  }

  if (summary.settlementState === "payable") {
    return {
      amount: summary.outstandingBalance,
      amountTone: "text-accent-rose",
      title: summary.receiverName ? `You owe ${summary.receiverName}` : "You owe",
      supporting: null as string | null
    };
  }

  return {
    amount: summary.outstandingBalance,
    amountTone: "text-state-success",
    title: summary.payerName ? `${summary.payerName} owes you` : "You are owed",
    supporting: null as string | null
  };
}

function statusBadge(summary: SharedSettlementSummary) {
  if (summary.settlementState === "settled" || summary.outstandingBalance <= 0) {
    return {
      className: "border-brand/40 bg-brand-deep",
      dotClassName: "bg-brand-soft",
      label: "All settled"
    };
  }

  if (summary.settlementState === "payable") {
    return {
      className: "border-accent-rose/40 bg-accent-rose/10",
      dotClassName: "bg-accent-rose",
      label: "Payment required"
    };
  }

  return {
    className: "border-state-success/40 bg-state-success/10",
    dotClassName: "bg-state-success",
    label: "Awaiting payment"
  };
}

function SummaryRow({
  currencyCode,
  label,
  locale,
  value
}: {
  currencyCode: string;
  label: string;
  locale: string;
  value: number;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-1">
      <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
        {label}
      </Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="font-sans text-xs font-semibold text-text" />
    </View>
  );
}

export function SharedSettlementHero({
  currencyCode,
  isSettling = false,
  locale,
  onMarkSettled,
  summary
}: {
  currencyCode: string;
  isSettling?: boolean;
  locale: string;
  onMarkSettled: () => void;
  summary: SharedSettlementSummary;
}) {
  const heading = settlementHeading(summary);
  const badge = statusBadge(summary);
  const isSettled = summary.settlementState === "settled" || summary.outstandingBalance <= 0;
  const otherPaidLabel = summary.otherParticipantName ? `${summary.otherParticipantName} Paid` : "Others Paid";

  return (
    <View className={`${dashboardLayout.elevatedCardClassName} gap-3 p-3.5`}>
      <View className="gap-2">
        <Text className="font-sans text-[11px] font-bold uppercase tracking-wide text-text-muted">Settlement Status</Text>
        <View className="gap-1">
          <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
            {heading.title}
          </Text>
          {heading.amount != null ? (
            <CurrencyText
              value={heading.amount}
              currencyCode={currencyCode}
              locale={locale}
              className={cn("font-sans text-3xl font-bold tabular-nums", heading.amountTone)}
            />
          ) : null}
          {heading.supporting ? <Text className="font-sans text-xs text-text-muted">{heading.supporting}</Text> : null}
        </View>

        <View className={cn("self-start flex-row items-center gap-1.5 rounded-full border px-2.5 py-1", badge.className)}>
          <View className={cn("h-1.5 w-1.5 rounded-full", badge.dotClassName)} />
          <Text className="font-sans text-[11px] font-semibold text-text">{badge.label}</Text>
        </View>
      </View>

      <View className="rounded-lg border border-surface-border bg-background-muted px-3 py-2">
        <SummaryRow currencyCode={currencyCode} label="You Paid" locale={locale} value={summary.totalPaidByCurrentUser} />
        <SummaryRow currencyCode={currencyCode} label={otherPaidLabel} locale={locale} value={summary.totalPaidByOtherParticipants} />
        <SummaryRow currencyCode={currencyCode} label="Total Shared Spend" locale={locale} value={summary.totalSharedSpend} />
      </View>

      {isSettled ? (
        <Text className="font-sans text-xs font-semibold text-text-muted">Everything is settled.</Text>
      ) : (
        <SecondaryButton
          accessibilityLabel="Mark settled"
          className="h-10 rounded-lg border-brand bg-brand-deep"
          disabled={!summary.canRecordSettlement || isSettling}
          icon="check-circle-outline"
          onPress={onMarkSettled}
        >
          Mark Settled
        </SecondaryButton>
      )}
    </View>
  );
}
