import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { ConfidenceBadge } from "@/features/inbox/components/ConfidenceBadge";
import { StatusBadge } from "@/features/inbox/components/StatusBadge";
import {
  draftOverallConfidence,
  formatDraftDate,
  isReadyDraft,
  merchantInitials,
  statusBadgeLabel,
  statusBadgeTone
} from "@/features/inbox/inboxModel";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { DraftTransactionApi } from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";
import { theme } from "@/theme";

interface InboxCardProps {
  currencyCode: CurrencyCode;
  draft: DraftTransactionApi;
  locale: string;
  onLongPress?: () => void;
  onPress?: () => void;
  selected?: boolean;
}

export function InboxCard({ currencyCode, draft, locale, onLongPress, onPress, selected = false }: InboxCardProps) {
  const confidence = draftOverallConfidence(draft);
  const amountLabel =
    draft.amount != null ? formatCurrency(draft.amount, currencyCode, locale) : "—";

  return (
    <Pressable
      accessibilityLabel={`${draft.merchant ?? "Draft transaction"} ${amountLabel}`}
      accessibilityRole="button"
      className={cn(
        "flex-row items-center gap-3 rounded-xl border bg-surface p-3.5",
        selected ? "border-brand bg-brand-deep/40" : "border-surface-border"
      )}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-deep">
        {selected ? (
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="check" size={theme.icons.md} />
        ) : (
          <Text className="font-sans text-sm font-bold text-brand-soft">{merchantInitials(draft.merchant)}</Text>
        )}
      </View>

      <View className="min-w-0 flex-1 gap-1.5">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="min-w-0 flex-1 font-sans text-base font-semibold text-text" numberOfLines={1}>
            {draft.merchant?.trim() || "Unknown merchant"}
          </Text>
          <Text className="font-sans text-base font-semibold text-text tabular-nums">{amountLabel}</Text>
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <Text className="min-w-0 flex-1 font-sans text-xs text-text-muted" numberOfLines={1}>
            {[formatDraftDate(draft.date, locale), draft.accountName || "No account"].filter(Boolean).join(" · ")}
          </Text>
          <MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <StatusBadge label={statusBadgeLabel(draft)} tone={statusBadgeTone(draft)} />
          {isReadyDraft(draft) && confidence > 0 ? <ConfidenceBadge confidence={confidence} /> : null}
        </View>
      </View>
    </Pressable>
  );
}
