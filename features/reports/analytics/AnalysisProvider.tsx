import type { PropsWithChildren } from "react";
import { useMemo, useState } from "react";

import { ReportsAnalyticsContext } from "@/features/reports/analytics/AnalysisContext";
import { defaultReportsAnalyticsState, type AnalysisDimension, type ReportsAnalyticsFilters, type SortMode } from "@/features/reports/analytics/analyticsState";

export function AnalysisProvider({ children, selectedCycle }: PropsWithChildren<{ selectedCycle: string | null }>) {
  const [state, setState] = useState({ ...defaultReportsAnalyticsState, selectedCycle });


  const value = useMemo(() => ({
    clearFilters: () => setState((current) => ({ ...current, filters: {} })),
    setAnalysisDimension: (analysisDimension: AnalysisDimension) => setState((current) => ({ ...current, analysisDimension })),
    setFilters: (filters: ReportsAnalyticsFilters) => setState((current) => ({ ...current, filters })),
    setSelectedCycle: (nextCycle: string | null) => setState((current) => ({ ...current, selectedCycle: nextCycle })),
    setSort: (sort: SortMode) => setState((current) => ({ ...current, sort })),
    state
  }), [state]);

  return <ReportsAnalyticsContext.Provider value={value}>{children}</ReportsAnalyticsContext.Provider>;
}
