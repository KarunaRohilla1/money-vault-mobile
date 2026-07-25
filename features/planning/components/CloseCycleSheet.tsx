import { Text, TextInput, View } from "react-native";

import { BottomSheet, CurrencyText, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { CloseReviewItem } from "@/features/planning/planningModel";
import { theme } from "@/theme";

interface CloseCycleSheetProps {
  currencyCode: string;
  error: string | null;
  items: CloseReviewItem[];
  locale: string;
  onChange: (items: CloseReviewItem[]) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  visible: boolean;
}

export function CloseCycleSheet({ currencyCode, error, items, locale, onChange, onClose, onSubmit, saving, visible }: CloseCycleSheetProps) {
  const paid = items.filter((item) => item.action === "Paid").length;
  const cancelled = items.filter((item) => item.action === "Cancelled").length;
  const carried = items.filter((item) => item.action === "Carry Forward").length;

  function updateItem(index: number, patch: Partial<CloseReviewItem>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <BottomSheet visible={visible} title="Close Cycle" onClose={onClose}>
      <View className="gap-4">
        {items.length === 0 ? (
          <Text className="font-sans text-sm text-text-muted">Everything has been completed.</Text>
        ) : (
          items.map((item, index) => (
            <View key={`${item.activity.kind}:${item.activity.id}`} className="gap-3 rounded-lg border border-surface-border bg-surface p-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>
                    {item.activity.name}
                  </Text>
                  <Text className="font-sans text-xs text-text-muted">Expected</Text>
                  <CurrencyText value={item.activity.expectedAmount} currencyCode={currencyCode} locale={locale} className="text-sm font-semibold" />
                </View>
                <TextInput
                  className="h-11 w-28 rounded-md border border-surface-border bg-background px-3 text-right font-sans text-base text-text"
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  onChangeText={(amount) => updateItem(index, { amount })}
                  placeholderTextColor={theme.colors.text.muted}
                  value={item.amount}
                />
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(["Paid", "Cancelled", "Carry Forward"] as const).map((action) => (
                  <SecondaryButton key={action} className={item.action === action ? "h-10 border-brand-soft px-3" : "h-10 px-3"} onPress={() => updateItem(index, { action })}>
                    {action}
                  </SecondaryButton>
                ))}
              </View>
            </View>
          ))
        )}
        <View className="flex-row gap-3">
          <Fact label="Paid" value={String(paid)} />
          <Fact label="Cancelled" value={String(cancelled)} />
          <Fact label="Carry" value={String(carried)} />
        </View>
        {error ? <Text className="font-sans text-sm font-semibold text-accent-rose">{error}</Text> : null}
        <View className="flex-row gap-3">
          <SecondaryButton className="flex-1" disabled={saving} onPress={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton className="flex-1" disabled={saving} loading={saving} onPress={onSubmit}>
            Close Cycle
          </PrimaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-lg bg-background-muted p-3">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <Text className="mt-1 font-sans text-sm font-semibold text-text">{value}</Text>
    </View>
  );
}
