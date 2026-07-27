import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { formatReportDate, formatReportValue } from "@/features/reports/reportModel";
import type { ReportFinancialReviewApi } from "@/services/api/types";
import { theme } from "@/theme";
import type { CurrencyCode } from "@/types/domain";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const rows: { icon: IconName; key: keyof Pick<ReportFinancialReviewApi, "period" | "totalTransactions" | "transfers" | "largestExpense" | "mostUsedCategory" | "mostUsedAccount">; label: string }[] = [
  { icon: "calendar-month-outline", key: "period", label: "Period" },
  { icon: "receipt-text-outline", key: "totalTransactions", label: "Total Transactions" },
  { icon: "swap-horizontal", key: "transfers", label: "Transfers" },
  { icon: "shopping-outline", key: "largestExpense", label: "Largest Expense" },
  { icon: "silverware-fork-knife", key: "mostUsedCategory", label: "Most Used Category" },
  { icon: "credit-card-outline", key: "mostUsedAccount", label: "Most Used Account" }
];

export function FinancialCycleReview({ currencyCode, locale, review }: { currencyCode: CurrencyCode; locale: string; review: ReportFinancialReviewApi }) {
  return (
    <View className="gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <Text className="font-sans text-sm font-bold uppercase text-brand-soft">Financial Cycle Review</Text>
      <View className="gap-4">
        <View className="gap-1">
          {rows.map((row) => (
            <ReviewRow icon={row.icon} key={row.key} label={row.label} value={reviewValue(review, row.key, currencyCode, locale)} />
          ))}
        </View>
        <View className="gap-4 rounded-xl border border-surface-border bg-background-muted p-4">
          <Text className="font-sans text-sm text-text">Biggest Purchase</Text>
          <View className="flex-row items-center gap-3 rounded-lg bg-surface p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
              <MaterialCommunityIcons name="silverware-fork-knife" size={theme.icons.md} color={theme.colors.brand.soft} />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>{review.biggestPurchase.title}</Text>
              <Text className="font-sans text-xl font-bold text-text tabular-nums" numberOfLines={1}>{formatReportValue(review.biggestPurchase.amount, "money", currencyCode, locale)}</Text>
              <Text className="font-sans text-sm text-text-muted">{formatReportDate(review.biggestPurchase.date, locale)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function reviewValue(review: ReportFinancialReviewApi, key: string, currencyCode: CurrencyCode, locale: string) {
  if (key === "period") return review.period;
  if (key === "totalTransactions") return String(review.totalTransactions);
  if (key === "transfers") return String(review.transfers);
  if (key === "largestExpense") return `${formatReportValue(review.biggestPurchase.amount, "money", currencyCode, locale)} ${review.largestExpense.value}`;
  if (key === "mostUsedCategory") return String(review.mostUsedCategory.value ?? "None");
  if (key === "mostUsedAccount") return String(review.mostUsedAccount.value ?? "None");
  return "None";
}

function ReviewRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View className="min-h-11 flex-row items-center gap-3 border-b border-surface-border py-2 last:border-b-0">
      <MaterialCommunityIcons name={icon} size={theme.icons.sm} color={theme.colors.brand.soft} />
      <Text className="min-w-0 flex-1 font-sans text-sm text-text-muted">{label}</Text>
      <Text className="max-w-44 text-right font-sans text-sm font-semibold text-text" numberOfLines={2}>{value}</Text>
    </View>
  );
}
