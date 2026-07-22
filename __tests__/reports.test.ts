import { formatReportValue, hasReportData, trendMaximum } from "@/features/reports/reportModel";
import type { ReportCategoryItemApi, ReportTrendItemApi } from "@/services/api/types";

const emptyTrend: ReportTrendItemApi[] = [
  {
    cashOutflow: 0,
    cycle: "10 Jul - 09 Aug",
    householdSpending: 0,
    income: 0,
    netPersonalCost: 0,
    savings: 0
  }
];

describe("reportModel", () => {
  it("formats money, count, text and null values", () => {
    expect(formatReportValue(1234, "money", "INR", "en-IN")).toContain("1,234");
    expect(formatReportValue(4.9, "count", "INR", "en-IN")).toBe("4");
    expect(formatReportValue("Food", "text", "INR", "en-IN")).toBe("Food");
    expect(formatReportValue(null, "text", "INR", "en-IN")).toBe("None");
  });

  it("treats zero-value trend and empty categories as empty report data", () => {
    expect(hasReportData([], emptyTrend)).toBe(false);
  });

  it("treats category rows as valid report data", () => {
    const categories: ReportCategoryItemApi[] = [
      {
        amount: 1200,
        icon: "label",
        key: "food:0",
        name: "Food",
        percent: 100
      }
    ];

    expect(hasReportData(categories, emptyTrend)).toBe(true);
  });

  it("keeps zero-value trend charts safe from divide-by-zero", () => {
    expect(trendMaximum(emptyTrend, "netPersonalCost")).toBe(1);
  });
});
