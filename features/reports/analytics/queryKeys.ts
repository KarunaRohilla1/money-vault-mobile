import type { ReportsAnalyticsState } from "@/features/reports/analytics/analyticsState";

export const reportsAnalyticsQueryKeys = {
  spending: (vaultId: string | null, state: ReportsAnalyticsState) => [
    "reports",
    "analytics",
    "spending",
    vaultId ?? "anonymous",
    state.selectedCycle ?? "current",
    state.analysisDimension,
    state.sort,
    JSON.stringify(state.filters)
  ] as const
};
