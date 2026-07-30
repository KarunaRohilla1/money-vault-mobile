import {
  adjacentReportCycle,
  cycleComparison,
  findReportCard,
  formatReportCycleRange,
  reportCycleDisplayMonth,
  formatReportValue,
  hasReportActivity,
  hasReportData,
  largestCategoryInsight,
  pickHeroMetric,
  orderedOverviewCards,
  pickHeroSecondaryMetrics,
  reportNumber,
  reportSummaryCaption,
  selectedReportCycle,
  shortCycleLabel,
  topCategories,
  trendMaximum,
  trendMetricForVault
} from "@/features/reports/reportModel";
import { adaptSpendingAnalytics, hasAnalyticsData, selectedChartItem, trendMaximum as analyticsTrendMaximum } from "@/features/reports/analytics/analyticsAdapter";
import { analyticsStateToRequest, hasAnalyticsFilters, type ReportsAnalyticsState } from "@/features/reports/analytics/analyticsState";
import type { ReportCategoryItemApi, ReportMoneyCardApi, ReportSpendingApiResponse, ReportTrendItemApi } from "@/services/api/types";

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

const cards: ReportMoneyCardApi[] = [
  {
    caption: "Money received this cycle",
    format: "money",
    key: "income",
    title: "Income",
    tone: "purple",
    value: 100000000
  },
  {
    caption: "Cash that left accounts",
    format: "money",
    key: "cash-outflow",
    title: "Cash Outflow",
    tone: "red",
    value: 45000
  },
  {
    caption: "Your true expense burden",
    format: "money",
    key: "net-cost",
    title: "Net Personal Cost",
    tone: "purple",
    value: 35000
  },
  {
    caption: "Income - net cost",
    format: "money",
    key: "savings",
    title: "Savings",
    tone: "green",
    value: 65000
  }
];

const categories: ReportCategoryItemApi[] = Array.from({ length: 7 }, (_, index) => ({
  amount: 7000 - index * 500,
  icon: "label",
  key: `category:${index}`,
  name: index === 0 ? "Very Long Dining Out And Weekend Food Category" : `Category ${index}`,
  percent: 30 - index
}));

describe("reportModel", () => {
  it("formats money, count, text and null values", () => {
    expect(formatReportValue(1234, "money", "INR", "en-IN")).toContain("1,234");
    expect(formatReportValue(4.9, "count", "INR", "en-IN")).toBe("4");
    expect(formatReportValue("Food", "text", "INR", "en-IN")).toBe("Food");
    expect(formatReportValue(null, "text", "INR", "en-IN")).toBe("None");
  });

  it("hides cycle comparison captions from report summary cards", () => {
    expect(reportSummaryCaption("vs July 2026")).toBeNull();
    expect(reportSummaryCaption(" VS Jun 2026 ")).toBeNull();
    expect(reportSummaryCaption("Cash that left accounts")).toBe("Cash that left accounts");
    expect(reportSummaryCaption("")).toBeNull();
  });

  it("treats zero-value trend and empty categories as empty report data", () => {
    expect(hasReportData([], emptyTrend)).toBe(false);
  });

  it("treats category rows as valid report data", () => {
    const categoryRows: ReportCategoryItemApi[] = [
      {
        amount: 1200,
        icon: "label",
        key: "food:0",
        name: "Food",
        percent: 100
      }
    ];

    expect(hasReportData(categoryRows, emptyTrend)).toBe(true);
  });

  it("keeps zero-value trend charts safe from divide-by-zero", () => {
    expect(trendMaximum(emptyTrend, "netPersonalCost")).toBe(1);
  });

  it("normalizes malformed trend values before chart math", () => {
    const malformedTrend = [
      {
        cashOutflow: Number.NaN,
        cycle: null,
        householdSpending: "1200",
        income: undefined,
        netPersonalCost: "bad",
        savings: Number.POSITIVE_INFINITY
      }
    ] as unknown as ReportTrendItemApi[];
    const [row] = malformedTrend;

    if (!row) {
      throw new Error("Expected malformed trend fixture.");
    }

    expect(reportNumber(row.netPersonalCost)).toBe(0);
    expect(reportNumber(row.householdSpending)).toBe(1200);
    expect(trendMaximum(malformedTrend, "netPersonalCost")).toBe(1);
    expect(shortCycleLabel(row.cycle)).toBe("");
  });

  it("selects one hero metric and compact secondary metrics for personal reports", () => {
    expect(pickHeroMetric(cards, false)?.key).toBe("net-cost");
    expect(pickHeroSecondaryMetrics(cards, false).map((card) => card.key)).toEqual(["income", "cash-outflow", "savings"]);
  });

  it("uses household spending as the shared vault hero metric", () => {
    const sharedCards: ReportMoneyCardApi[] = [
      {
        caption: "Total shared vault spend",
        format: "money",
        key: "household",
        title: "Household Spending",
        tone: "purple",
        value: 4215
      }
    ];

    expect(pickHeroMetric(sharedCards, true)?.key).toBe("household");
    expect(trendMetricForVault(true)).toBe("householdSpending");
  });

  it("shows only five categories until view-all expansion is requested", () => {
    expect(topCategories(categories, false)).toHaveLength(5);
    expect(topCategories(categories, true)).toHaveLength(7);
  });

  it("derives a safe largest-category insight without new calculations", () => {
    expect(largestCategoryInsight(categories, false)).toBe("Very Long Dining Out And Weekend Food Category was your largest category this cycle.");
    expect(largestCategoryInsight([], false)).toBeNull();
  });

  it("describes valid cycle comparisons and skips invalid previous zero values", () => {
    const trend: ReportTrendItemApi[] = [
      { cashOutflow: 0, cycle: "May", householdSpending: 0, income: 0, netPersonalCost: 0, savings: 0 },
      { cashOutflow: 0, cycle: "Jun", householdSpending: 0, income: 0, netPersonalCost: 5000, savings: 0 },
      { cashOutflow: 0, cycle: "Jul", householdSpending: 0, income: 0, netPersonalCost: 7500, savings: 0 }
    ];

    expect(cycleComparison(trend.slice(0, 2), "netPersonalCost", "INR", "en-IN")).toBeNull();
    expect(cycleComparison(trend.slice(1), "netPersonalCost", "INR", "en-IN")).toContain("more than previous cycle");
  });

  it("keeps long cycle labels compact", () => {
    expect(shortCycleLabel("22 Jun - 21 Jul 2026")).toBe("22 Jun-21 Jul 2026");
  });

  it("finds cards by key for progressive report presentation", () => {
    expect(findReportCard(cards, "income")?.title).toBe("Income");
    expect(findReportCard(cards, "missing")).toBeUndefined();
  });
  it("orders the mobile overview cards and ignores backend-only extra cards", () => {
    const withExtra: ReportMoneyCardApi[] = [
      ...cards,
      { caption: "Not shown in the mobile overview grid", format: "money", key: "settlements", title: "Outstanding Settlements", tone: "red", value: 1250 }
    ];

    expect(orderedOverviewCards(withExtra).map((card) => card.key)).toEqual(["income", "cash-outflow", "net-cost", "savings"]);
  });

  it("selects adjacent financial cycles for previous and next buttons", () => {
    const options = [
      { endDate: "2026-06-30", key: "2026-06-01", label: "June 2026", startDate: "2026-06-01", status: "Completed" },
      { endDate: "2026-07-31", key: "2026-07-01", label: "July 2026", startDate: "2026-07-01", status: "Current" },
      { endDate: "2026-08-31", key: "2026-08-01", label: "August 2026", startDate: "2026-08-01", status: "Upcoming" }
    ];

    expect(selectedReportCycle(options, "2026-07-01")?.label).toBe("July 2026");
    expect(adjacentReportCycle(options, "2026-07-01", "previous")?.key).toBe("2026-06-01");
    expect(adjacentReportCycle(options, "2026-07-01", "next")?.key).toBe("2026-08-01");
    expect(adjacentReportCycle(options, "2026-06-01", "previous")).toBeNull();
  });

  it("formats the selected report cycle as Month Year", () => {
    expect(reportCycleDisplayMonth({ startDate: "2026-07-01" }, "en-IN")).toBe("July 2026");
  });
  it("formats the mobile report cycle range with short dates", () => {
    expect(formatReportCycleRange("2026-07-01", "2026-07-31", "en-IN")).toBe("01 Jul \u2192 31 Jul");
  });

  it("detects empty overview activity without hiding zero-value cards", () => {
    const zeroCards: ReportMoneyCardApi[] = cards.map((card) => ({ ...card, value: 0 }));

    expect(hasReportActivity(0, zeroCards)).toBe(false);
    expect(hasReportActivity(3, zeroCards)).toBe(true);
  });
  it("adapts spending analytics into dimension-driven UI sections", () => {
    const response = {
      data: {
        breakdown: { rows: [{ amount: 1500, icon: "food", id: "c1", key: "c1", label: "Dining", percent: 75, subLabel: "3 transactions", transactionCount: 3 }], title: "Category Breakdown" },
        metadata: { dimension: "categories", emptyMessage: "No category spending.", emptyTitle: "No categories", filterOptions: { accounts: [], categories: [], merchants: [], paymentModes: [] }, question: "Where is my money going?" },
        summary: [{ caption: "vs Jun", format: "money", key: "total-spent", title: "Total Spent", tone: "red", value: 2000 }],
        trend: { points: [{ amount: 2000, date: "2026-07-10", label: "10" }], title: "Spending by Category Trend" },
        visualization: { items: [{ amount: 1500, color: "#fff", icon: "food", id: "c1", key: "c1", label: "Dining", percent: 75, transactionCount: 3 }], title: "Spending by Category", total: 1500, type: "donut" }
      },
      filters: { cycleStart: "2026-07-01", endDate: "2026-07-31", period: "cycle", startDate: "2026-07-01" },
      generatedAt: "2026-07-20T00:00:00Z",
      vault: { id: "1", isAdmin: true, name: "KR", vaultType: "Individual" }
    } satisfies ReportSpendingApiResponse;

    const model = adaptSpendingAnalytics(response);
    expect(model?.question).toBe("Where is my money going?");
    expect(model?.chart.type).toBe("donut");
    expect(model?.breakdown.rows[0]?.label).toBe("Dining");
    expect(selectedChartItem(model?.chart.items ?? [], null)?.key).toBe("c1");
    expect(analyticsTrendMaximum(model?.trend.points ?? [])).toBe(2000);
    expect(hasAnalyticsData(model)).toBe(true);
  });

  it("serializes analytics state with dimension and global filters", () => {
    const state: ReportsAnalyticsState = {
      analysisDimension: "merchants",
      filters: { account: "HDFC", amountMin: 100, category: "Dining" },
      selectedCycle: "2026-07-01",
      sort: "amountDesc"
    };
    expect(hasAnalyticsFilters(state.filters)).toBe(true);
    expect(analyticsStateToRequest(state)).toEqual({
      account: "HDFC",
      amountMax: undefined,
      amountMin: 100,
      category: "Dining",
      cycleStart: "2026-07-01",
      dimension: "merchants",
      merchant: undefined,
      paymentMode: undefined,
      transactionType: undefined
    });
  });
});
