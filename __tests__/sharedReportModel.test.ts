import { hasSharedReportData } from "@/features/reports/sharedReportModel";
import type { ReportSharedApiResponse } from "@/services/api/types";

const sampleReport: ReportSharedApiResponse = {
  data: {
    categoryImpact: [],
    contribution: { items: [], total: 0 },
    hero: {
      actualSpend: 0,
      comparisonLabel: "Matches actual spend",
      difference: 0,
      percentLower: 0,
      projectedPersonalSpend: 0
    },
    settlementOverview: [],
    settlementPreview: {
      currentAmount: 0,
      currentLabel: "All balances settled",
      projectedPersonalSpend: 0
    },
    topExpenses: []
  },
  filters: {
    cycleStart: "2026-07-10",
    endDate: "2026-08-09",
    period: "cycle",
    startDate: "2026-07-10"
  },
  generatedAt: "2026-08-07T00:00:00.000Z",
  vault: {
    id: "1",
    isAdmin: false,
    name: "Karuna",
    vaultType: "Individual"
  }
};

describe("sharedReportModel", () => {
  it("treats empty shared report payloads as empty", () => {
    expect(hasSharedReportData(sampleReport)).toBe(false);
  });

  it("detects shared report activity from hero and expenses", () => {
    expect(
      hasSharedReportData({
        ...sampleReport,
        data: {
          ...sampleReport.data,
          hero: { ...sampleReport.data.hero, projectedPersonalSpend: 18650 },
          topExpenses: [{ amount: 6000, date: "2026-07-02", icon: "airplane", id: 1, name: "Goa Trip" }]
        }
      })
    ).toBe(true);
  });
});
