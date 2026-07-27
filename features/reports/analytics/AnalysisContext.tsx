import { createContext, useContext } from "react";

import type { AnalysisDimension, ReportsAnalyticsFilters, ReportsAnalyticsState, SortMode } from "@/features/reports/analytics/analyticsState";

interface ReportsAnalyticsContextValue {
  clearFilters: () => void;
  setAnalysisDimension: (dimension: AnalysisDimension) => void;
  setFilters: (filters: ReportsAnalyticsFilters) => void;
  setSelectedCycle: (cycleStart: string | null) => void;
  setSort: (sort: SortMode) => void;
  state: ReportsAnalyticsState;
}

export const ReportsAnalyticsContext = createContext<ReportsAnalyticsContextValue | null>(null);

export function useReportsAnalytics() {
  const value = useContext(ReportsAnalyticsContext);
  if (!value) {
    throw new Error("useReportsAnalytics must be used inside AnalysisProvider");
  }
  return value;
}
