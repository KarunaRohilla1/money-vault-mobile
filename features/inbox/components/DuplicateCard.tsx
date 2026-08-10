import { Text, View } from "react-native";

import { formatCurrency } from "@/lib/format";
import { formatDraftDate } from "@/features/inbox/inboxModel";
import type { DraftTransactionApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

interface DuplicateCardProps {
  currencyCode: CurrencyCode;
  draft: DraftTransactionApi;
  locale: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-2">
      <Text className="font-sans text-sm text-text-muted">{label}</Text>
      <Text className="min-w-0 flex-1 text-right font-sans text-sm font-semibold text-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function DuplicateCard({ currencyCode, draft, locale }: DuplicateCardProps) {
  return (
    <View className="rounded-xl border border-brand-muted bg-surface p-4">
      <Row label="Amount" value={draft.amount != null ? formatCurrency(draft.amount, currencyCode, locale) : "—"} />
      <Row label="Merchant" value={draft.merchant?.trim() || "Unknown"} />
      <Row label="Date" value={formatDraftDate(draft.date, locale)} />
      <Row label="Account" value={draft.accountName?.trim() || "No account"} />
    </View>
  );
}
