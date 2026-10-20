import { formatReportValue, reportNumber } from "@/features/reports/reportModel";
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

  it("safely handles null or undefined report objects", () => {
    expect(hasSharedReportData(undefined)).toBe(false);
    expect(hasSharedReportData(null)).toBe(false);
    expect(hasSharedReportData({} as any)).toBe(false);
    expect(hasSharedReportData({ data: {} } as any)).toBe(false);
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

  it("detects shared report activity from fundingVsShare", () => {
    expect(
      hasSharedReportData({
        ...sampleReport,
        data: {
          ...sampleReport.data,
          fundingVsShare: [
            {
              isCurrentUser: true,
              name: "Karuna",
              netDifference: 0,
              paidAmount: 100,
              paidPercent: 50,
              shareAmount: 100,
              sharePercent: 50,
              vaultId: 1
            }
          ]
        }
      })
    ).toBe(true);
  });
});

describe("formatReportValue edge cases", () => {
  it("formats undefined and null safely", () => {
    expect(formatReportValue(undefined, "money", "INR", "en-IN")).toBe("₹0");
    expect(formatReportValue(null, "money", "INR", "en-IN")).toBe("None");
    expect(formatReportValue(undefined, "count", "INR", "en-IN")).toBe("None");
  });

  it("handles non-finite and string numbers safely", () => {
    expect(formatReportValue(NaN, "money", "INR", "en-IN")).toBe("₹0");
    expect(formatReportValue(Infinity, "money", "INR", "en-IN")).toBe("₹0");
    expect(formatReportValue("1500", "money", "INR", "en-IN")).toBe("₹1,500");
  });

  it("safely extracts numbers using reportNumber", () => {
    expect(reportNumber(undefined)).toBe(0);
    expect(reportNumber(null)).toBe(0);
    expect(reportNumber(NaN)).toBe(0);
    expect(reportNumber("invalid")).toBe(0);
    expect(reportNumber(250)).toBe(250);
    expect(reportNumber("250.50")).toBe(250.5);
  });
});
