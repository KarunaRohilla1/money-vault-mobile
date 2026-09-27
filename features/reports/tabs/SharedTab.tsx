import { Text, View } from "react-native";

import { ErrorView } from "@/components/ui/ErrorView";
import { SharedCategoryBreakdownSection } from "@/features/reports/components/shared/SharedCategoryBreakdownSection";
import { SharedFundingVsShareSection } from "@/features/reports/components/shared/SharedFundingVsShareSection";
import { SharedSummarySection } from "@/features/reports/components/shared/SharedSummarySection";
import { SharedTopExpensesSection } from "@/features/reports/components/shared/SharedTopExpensesSection";
import { SharedTrendSection } from "@/features/reports/components/shared/SharedTrendSection";
import { useSharedReportQuery } from "@/features/reports/api";
import { hasSharedReportData } from "@/features/reports/sharedReportModel";
import type { CurrencyCode } from "@/types/domain";

interface SharedTabProps {
  currencyCode: CurrencyCode;
  cycleStart: string | null;
  locale: string;
  token: string | null;
  vaultId: string | null;
}

export function SharedTab({ currencyCode, cycleStart, locale, token, vaultId }: SharedTabProps) {
  const query = useSharedReportQuery(token, vaultId, cycleStart, Boolean(cycleStart));

  if (query.isPending && !query.data) {
    return <SharedTabSkeleton />;
  }

  if (query.isError) {
    return (
      <ErrorView
        message="Could not load shared report details. Check your connection and try again."
        onRetry={() => query.refetch()}
        title="Shared report unavailable"
      />
    );
  }

  if (!hasSharedReportData(query.data)) {
    return (
      <View className="gap-4 rounded-xl border border-surface-border bg-surface p-6">
        <Text className="text-center font-sans text-lg font-bold text-text">No shared activity</Text>
        <Text className="text-center font-sans text-sm text-text-muted">Shared expense impact will appear here once shared transactions are recorded for this cycle.</Text>
      </View>
    );
  }

  const report = query.data;
  if (!report) {
    return null;
  }

  return (
    <View className="gap-5">
      <SharedSummarySection currencyCode={currencyCode} locale={locale} summary={report.data.summary} />
      <SharedFundingVsShareSection currencyCode={currencyCode} fundingVsShare={report.data.fundingVsShare} locale={locale} />
      <SharedCategoryBreakdownSection categories={report.data.categoryBreakdown} currencyCode={currencyCode} locale={locale} />
      <SharedTrendSection currencyCode={currencyCode} locale={locale} trend={report.data.trend} />
      <SharedTopExpensesSection currencyCode={currencyCode} expenses={report.data.topExpenses} locale={locale} />
    </View>
  );
}

function SharedTabSkeleton() {
  return <View className="gap-4">{[0, 1, 2, 3, 4].map((item) => <View className="h-40 rounded-xl bg-surface" key={item} />)}</View>;
}
