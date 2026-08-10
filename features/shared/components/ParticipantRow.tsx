import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import type { SharedParticipantViewModel } from "@/features/shared/sharedDashboardModel";

function balanceTone(balance: number) {
  if (balance < 0) {
    return "text-accent-rose";
  }

  if (balance > 0) {
    return "text-state-success";
  }

  return "text-text-muted";
}

export function ParticipantRow({
  currencyCode,
  locale,
  participant
}: {
  currencyCode: string;
  locale: string;
  participant: SharedParticipantViewModel;
}) {
  return (
    <View
      accessibilityLabel={`${participant.displayName}, balance ${participant.balanceLabel}`}
      className="min-h-16 flex-row items-center gap-3 border-b border-surface-border py-3 last:border-b-0"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
        <Text className="font-sans text-sm font-bold text-brand-soft">{participant.avatarInitial}</Text>
      </View>
      <View className="min-w-0 flex-1 gap-2">
        <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
          {participant.displayName}
        </Text>
        <View className="flex-row gap-4">
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-xs text-text-muted">Paid</Text>
            <CurrencyText value={participant.paid} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-semibold text-text" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-xs text-text-muted">Share</Text>
            <CurrencyText value={participant.share} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-semibold text-text" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans text-xs text-text-muted">Balance</Text>
            <Text className={`font-sans text-sm font-semibold ${balanceTone(participant.balance)}`} numberOfLines={2}>
              {participant.balanceLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function ParticipantsSection({
  currencyCode,
  locale,
  participants
}: {
  currencyCode: string;
  locale: string;
  participants: SharedParticipantViewModel[];
}) {
  return (
    <View className="gap-3">
      {participants.map((participant) => (
        <ParticipantRow
          key={participant.vaultId}
          currencyCode={currencyCode}
          locale={locale}
          participant={participant}
        />
      ))}
      <Text className="font-sans text-xs text-text-muted">Balances update automatically as expenses are added.</Text>
    </View>
  );
}

export function ParticipantsCard({
  children
}: {
  children: ReactNode;
}) {
  return <View className={`${dashboardLayout.cardClassName} px-4`}>{children}</View>;
}
