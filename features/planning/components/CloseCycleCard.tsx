import { Text, View } from "react-native";

import { CurrencyText, PrimaryButton } from "@/components/ui";

interface CloseCycleCardProps {
  currencyCode: string;
  locale: string;
  onClose: () => void;
  pendingCount: number;
  projectedSavings: number;
  saving: boolean;
  totalCount: number;
}

export function CloseCycleCard({ currencyCode, locale, onClose, pendingCount, projectedSavings, saving, totalCount }: CloseCycleCardProps) {
  const completed = Math.max(totalCount - pendingCount, 0);
  const percent = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 100;

  return (
    <View className="gap-4 rounded-xl border border-brand-muted bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-lg font-semibold text-text">Close cycle</Text>
          <Text className="font-sans text-sm text-text-muted">{pendingCount === 0 ? "Everything is resolved." : `${pendingCount} items still need review.`}</Text>
        </View>
        <Text className="font-sans text-sm font-semibold text-brand-soft">{percent}%</Text>
      </View>
      <View className="flex-row gap-3">
        <View className="min-w-0 flex-1 rounded-lg bg-background-muted p-3">
          <Text className="font-sans text-xs text-text-muted">Projected savings</Text>
          <CurrencyText value={projectedSavings} currencyCode={currencyCode} locale={locale} className="mt-1 text-base font-semibold" />
        </View>
        <View className="min-w-0 flex-1 rounded-lg bg-background-muted p-3">
          <Text className="font-sans text-xs text-text-muted">Completed</Text>
          <Text className="mt-1 font-sans text-base font-semibold text-text">
            {completed}/{totalCount}
          </Text>
        </View>
      </View>
      <PrimaryButton loading={saving} disabled={saving} icon="lock-check-outline" onPress={onClose}>
        Review close
      </PrimaryButton>
    </View>
  );
}
