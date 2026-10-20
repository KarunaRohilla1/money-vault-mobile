import type { ReportSharedApiResponse } from "@/services/api/types";
import { reportNumber } from "@/features/reports/reportModel";

export function hasSharedReportData(report: ReportSharedApiResponse | undefined | null) {
  if (!report || !report.data) {
    return false;
  }

  const { summary, categoryBreakdown = [], fundingVsShare = [], topExpenses = [] } = report.data;

  return (
    reportNumber(summary?.totalSharedSpend) > 0 ||
    reportNumber(summary?.myShare) > 0 ||
    (Array.isArray(fundingVsShare) && fundingVsShare.length > 0) ||
    (Array.isArray(categoryBreakdown) && categoryBreakdown.length > 0) ||
    (Array.isArray(topExpenses) && topExpenses.length > 0)
  );
}
