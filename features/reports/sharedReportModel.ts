import type { ReportSharedApiResponse } from "@/services/api/types";
import { reportNumber } from "@/features/reports/reportModel";

export function hasSharedReportData(report: ReportSharedApiResponse | undefined) {
  if (!report) {
    return false;
  }

  const { summary, categoryBreakdown, fundingVsShare, topExpenses } = report.data;

  return (
    reportNumber(summary.totalSharedSpend) > 0 ||
    reportNumber(summary.myShare) > 0 ||
    fundingVsShare.length > 0 ||
    categoryBreakdown.length > 0 ||
    topExpenses.length > 0
  );
}
