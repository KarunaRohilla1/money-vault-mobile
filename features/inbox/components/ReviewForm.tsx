import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

import type { IconName } from "@/constants/navigation";
import { ConfidenceBadge } from "@/features/inbox/components/ConfidenceBadge";
import { draftFieldConfidence, type ReviewFormValues } from "@/features/inbox/inboxModel";
import type { DraftTransactionApi } from "@/services/api/types";
import { theme } from "@/theme";

interface ReviewFormProps {
  draft: DraftTransactionApi;
  onChange: (values: ReviewFormValues) => void;
  onSelectAccount: () => void;
  onSelectCategory: () => void;
  onSelectDate: () => void;
  values: ReviewFormValues;
}

function ReviewRow({
  icon,
  label,
  onPress,
  trailing,
  value
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  value: string;
}) {
  const content = (
    <View className="flex-row items-center gap-3 rounded-xl border border-surface-border bg-surface px-3.5 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-deep">
        <MaterialCommunityIcons color={theme.colors.brand.soft} name={icon} size={theme.icons.sm} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-xs font-semibold uppercase text-text-muted">{label}</Text>
        <Text className="mt-0.5 font-sans text-base font-semibold text-text" numberOfLines={2}>
          {value || "—"}
        </Text>
        {trailing}
      </View>
      {onPress ? <MaterialCommunityIcons color={theme.colors.text.subtle} name="pencil-outline" size={theme.icons.sm} /> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityLabel={`Edit ${label}`} accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

export function ReviewForm({ draft, onChange, onSelectAccount, onSelectCategory, onSelectDate, values }: ReviewFormProps) {
  const categoryConfidence = draftFieldConfidence(draft, "category");

  return (
    <View className="gap-3">
      <View className="rounded-xl border border-surface-border bg-surface px-3.5 py-3">
        <Text className="mb-2 font-sans text-xs font-semibold uppercase text-text-muted">Merchant</Text>
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="storefront-outline" size={theme.icons.sm} />
          <TextInput
            className="min-h-10 flex-1 font-sans text-base font-semibold text-text"
            placeholder="Merchant"
            placeholderTextColor={theme.colors.text.subtle}
            value={values.merchant}
            onChangeText={(merchant) => onChange({ ...values, merchant })}
          />
        </View>
      </View>

      <View className="rounded-xl border border-surface-border bg-surface px-3.5 py-3">
        <Text className="mb-2 font-sans text-xs font-semibold uppercase text-text-muted">Amount</Text>
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons color={theme.colors.brand.soft} name="currency-inr" size={theme.icons.sm} />
          <TextInput
            className="min-h-10 flex-1 font-sans text-base font-semibold text-text"
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.text.subtle}
            value={values.amount}
            onChangeText={(amount) => onChange({ ...values, amount })}
          />
        </View>
      </View>

      <ReviewRow icon="calendar-month-outline" label="Date" value={values.date} onPress={onSelectDate} />
      <ReviewRow
        icon="credit-card-outline"
        label="Account"
        value={values.accountName || "Select account"}
        onPress={onSelectAccount}
      />
      <ReviewRow
        icon="tag-outline"
        label="Category"
        value={values.categoryName ? `${values.categoryName}${categoryConfidence ? " (Suggested)" : ""}` : "Select category"}
        onPress={onSelectCategory}
        trailing={
          categoryConfidence != null ? (
            <View className="mt-2">
              <ConfidenceBadge confidence={categoryConfidence} />
            </View>
          ) : null
        }
      />

      <View className="rounded-xl border border-surface-border bg-surface px-3.5 py-3">
        <Text className="mb-2 font-sans text-xs font-semibold uppercase text-text-muted">Notes</Text>
        <TextInput
          className="min-h-20 font-sans text-base text-text"
          multiline
          placeholder="Notes"
          placeholderTextColor={theme.colors.text.subtle}
          textAlignVertical="top"
          value={values.notes}
          onChangeText={(notes) => onChange({ ...values, notes })}
        />
      </View>
    </View>
  );
}
