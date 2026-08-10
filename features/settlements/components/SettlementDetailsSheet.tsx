import { Text, View } from "react-native";

import { BottomSheet, CurrencyText, PrimaryButton } from "@/components/ui";
import type { SettlementDetailsViewModel } from "@/features/settlements/types";
import type { CurrencyCode } from "@/types/domain";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-12 flex-row items-center justify-between gap-3 border-b border-surface-border py-3">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      <Text className="max-w-[60%] text-right font-sans text-sm font-semibold text-text">{value}</Text>
    </View>
  );
}

export function SettlementDetailsSheet({
  currencyCode,
  details,
  locale,
  onClose,
  visible
}: {
  currencyCode: CurrencyCode | string;
  details: SettlementDetailsViewModel | null;
  locale: string;
  onClose: () => void;
  visible: boolean;
}) {
  return (
    <BottomSheet visible={visible} title="Settlement Details" onClose={onClose}>
      {!details ? (
        <Text className="font-sans text-sm text-text-muted">Settlement details unavailable.</Text>
      ) : (
        <View className="gap-4">
          <View className="gap-1">
            <Text className="font-sans text-lg font-semibold text-text">{details.title}</Text>
            <CurrencyText
              value={details.amount}
              currencyCode={currencyCode}
              locale={locale}
              className={details.isReceived ? "font-sans text-2xl font-bold text-state-success" : "font-sans text-2xl font-bold text-text"}
            />
          </View>

          <View className="rounded-xl border border-surface-border bg-surface px-4">
            <DetailRow label="Status" value={details.statusLabel} />
            <DetailRow label="From" value={details.fromLabel} />
            <DetailRow label="To" value={details.toLabel} />
            <View className="min-h-12 flex-row items-center justify-between gap-3 border-b border-surface-border py-3">
              <Text className="font-sans text-sm text-text-muted">Amount</Text>
              <CurrencyText value={details.amount} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-semibold text-text" />
            </View>
            <DetailRow label="Date" value={details.dateLabel} />
            {details.timeLabel ? <DetailRow label="Time" value={details.timeLabel} /> : null}
            {details.paymentMethod ? <DetailRow label="Payment Method" value={details.paymentMethod} /> : null}
            {details.notes ? <DetailRow label="Notes" value={details.notes} /> : null}
          </View>

          {details.isPartial && typeof details.outstandingBefore === "number" && typeof details.outstandingAfter === "number" ? (
            <View className="items-center gap-3 rounded-xl border border-surface-border bg-surface-raised px-4 py-4">
              <View className="w-full flex-row items-center justify-between gap-3">
                <Text className="font-sans text-sm text-text-muted">Outstanding Before</Text>
                <CurrencyText value={details.outstandingBefore} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-semibold text-text" />
              </View>
              <Text className="font-sans text-lg text-text-muted">↓</Text>
              <View className="w-full flex-row items-center justify-between gap-3">
                <Text className="font-sans text-sm text-text-muted">Outstanding After</Text>
                <CurrencyText value={details.outstandingAfter} currencyCode={currencyCode} locale={locale} className="font-sans text-sm font-semibold text-text" />
              </View>
            </View>
          ) : null}

          <PrimaryButton accessibilityLabel="Done" onPress={onClose}>
            Done
          </PrimaryButton>
        </View>
      )}
    </BottomSheet>
  );
}
