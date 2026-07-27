import { Text, TextInput, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { closeCycleAmountLabel, shouldShowCloseCycleAmountField } from "@/features/planning/closeCycleUi";
import type { CloseAction, CloseReviewItem } from "@/features/planning/planningModel";
import { theme } from "@/theme";

interface CloseCycleAmountSectionProps {
  amount: string;
  currencyCode: string;
  item: CloseReviewItem;
  locale: string;
  onAmountChange: (amount: string) => void;
}

export function CloseCycleAmountSection({ amount, currencyCode, item, locale, onAmountChange }: CloseCycleAmountSectionProps) {
  const amountLabel = closeCycleAmountLabel(item.action, item.activity.kind);
  const showAmountField = shouldShowCloseCycleAmountField(item.action);

  return (
    <View className="gap-3 rounded-lg bg-background-muted p-3">
      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[42%] flex-1 gap-1">
          <Text className="font-sans text-xs text-text-muted">Expected</Text>
          <CurrencyText value={item.activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-lg font-semibold" />
        </View>
        {showAmountField && amountLabel ? (
          <View className="min-w-[48%] flex-1 gap-1">
            <Text className="font-sans text-xs font-semibold text-brand-soft">{amountLabel}</Text>
            <TextInput
              accessibilityLabel={actualAmountAccessibilityLabel(item.action, item.activity.name)}
              className="h-10 rounded-lg border border-brand-muted bg-background px-3 font-sans text-sm text-text"
              inputMode="decimal"
              keyboardType="decimal-pad"
              onChangeText={onAmountChange}
              placeholderTextColor={theme.colors.text.muted}
              value={amount}
            />
          </View>
        ) : null}
      </View>
      {!showAmountField ? <Text className="font-sans text-xs text-text-muted">No amount is required for this resolution.</Text> : null}
    </View>
  );
}

function actualAmountAccessibilityLabel(action: CloseAction, name: string) {
  if (action === "Carry Forward") return `Carry-forward amount for ${name}.`;
  return `Actual paid amount for ${name}.`;
}
