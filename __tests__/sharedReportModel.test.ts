import { hasSharedReportData } from "@/features/reports/sharedReportModel";
import type { ReportSharedApiResponse } from "@/services/api/types";

const sampleReport: ReportSharedApiResponse = {
  data: {
    categoryBreakdown: [],
    fundingVsShare: [],
    summary: {
      comparison: null,
      myShare: 0,
      mySharePercent: 0,
      previousMyShare: 0,
      previousTotalSharedSpend: 0,
      totalSharedSpend: 0,
      transactionCount: 0
    },
    topExpenses: [],
    trend: []
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

  it("detects shared report activity from summary and expenses", () => {
    expect(
      hasSharedReportData({
        ...sampleReport,
        data: {
          ...sampleReport.data,
          summary: { ...sampleReport.data.summary, myShare: 18650, totalSharedSpend: 37300 },
          topExpenses: [{ amount: 6000, date: "2026-07-02", icon: "airplane", id: 1, name: "Goa Trip" }]
        }
      })
    ).toBe(true);
  });
});

