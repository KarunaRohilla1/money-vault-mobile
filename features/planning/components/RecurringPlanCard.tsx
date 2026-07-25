import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { CurrencyText } from "@/components/ui";
import { theme } from "@/theme";

interface RecurringPlanCardProps {
  commitmentCount: number;
  commitmentTotal: number;
  currencyCode: string;
  incomeCount: number;
  incomeTotal: number;
  locale: string;
  onManage: () => void;
}

export function RecurringPlanCard({ commitmentCount, commitmentTotal, currencyCode, incomeCount, incomeTotal, locale, onManage }: RecurringPlanCardProps) {
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-lg font-semibold text-text">Recurring plan</Text>
          <Text className="font-sans text-sm text-text-muted">Templates used every cycle</Text>
        </View>
        <Pressable accessibilityLabel="Manage recurring plan" accessibilityRole="button" className="min-h-11 flex-row items-center gap-2 rounded-full border border-brand-muted px-4" onPress={onManage}>
          <MaterialCommunityIcons name="pencil-outline" size={theme.icons.sm} color={theme.colors.brand.soft} />
          <Text className="font-sans text-sm font-semibold text-brand-soft">Manage</Text>
        </Pressable>
      </View>
      <View className="flex-row gap-3">
        <PlanMetric count={incomeCount} currencyCode={currencyCode} label="Income templates" locale={locale} value={incomeTotal} />
        <PlanMetric count={commitmentCount} currencyCode={currencyCode} label="Commitments" locale={locale} value={commitmentTotal} />
      </View>
    </View>
  );
}

function PlanMetric({ count, currencyCode, label, locale, value }: { count: number; currencyCode: string; label: string; locale: string; value: number }) {
  return (
    <View className="min-w-0 flex-1 rounded-lg bg-background-muted p-3">
      <Text className="font-sans text-xs text-text-muted">{label}</Text>
      <Text className="mt-1 font-sans text-sm font-semibold text-text">{count} items</Text>
      <CurrencyText value={value} currencyCode={currencyCode} locale={locale} className="mt-1 text-sm font-semibold text-brand-soft" />
    </View>
  );
}
