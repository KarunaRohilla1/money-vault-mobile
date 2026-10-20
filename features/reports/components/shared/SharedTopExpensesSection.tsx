import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { CategoryIcon } from "@/features/categories/components/CategoryIcon";
import { formatReportDate, formatReportValue, reportNumber } from "@/features/reports/reportModel";
import type { ReportSharedExpenseItemApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

interface SharedTopExpensesSectionProps {
  currencyCode: CurrencyCode;
  expenses?: ReportSharedExpenseItemApi[] | null;
  locale: string;
}

export function SharedTopExpensesSection({ currencyCode, expenses = [], locale }: SharedTopExpensesSectionProps) {
  const router = useRouter();
  const items = Array.isArray(expenses) ? expenses.filter(Boolean) : [];

  return (
    <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Largest Shared Expenses</Text>
      {items.length === 0 ? (
        <Text className="py-6 text-center font-sans text-sm text-text-muted">No shared expenses recorded for this cycle.</Text>
      ) : (
        <View className="gap-2">
          {items.map((expense, index) => {
            const amount = Math.max(0, reportNumber(expense?.amount));
            const name = expense?.name?.trim() || "Expense";
            const icon = expense?.icon || "🏷️";
            const expenseId = expense?.id ?? index;
            const safeKey = `top-expense-${expenseId}-${index}`;

            return (
              <Pressable
                accessibilityRole="button"
                className="min-h-14 flex-row items-center gap-3 rounded-lg border border-surface-border bg-background-muted px-3 py-2"
                key={safeKey}
                onPress={() => router.push(`/transaction/${expenseId}`)}
              >
                <CategoryIcon emoji={icon} size="sm" />
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text className="font-sans text-sm font-semibold text-text" numberOfLines={1}>{name}</Text>
                  <Text className="font-sans text-xs text-text-muted">{formatReportDate(expense?.date, locale)}</Text>
                </View>
                <Text className="font-sans text-sm font-bold text-text tabular-nums">{formatReportValue(amount, "money", currencyCode, locale)}</Text>
                <MaterialCommunityIcons color={theme.colors.text.subtle} name="chevron-right" size={theme.icons.sm} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
