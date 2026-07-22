import {
  cycleComparison,
  findReportCard,
  formatReportValue,
  hasReportData,
  largestCategoryInsight,
  pickHeroMetric,
  pickHeroSecondaryMetrics,
  reportNumber,
  shortCycleLabel,
  topCategories,
  trendMaximum,
  trendMetricForVault
} from "@/features/reports/reportModel";
import type { ReportCategoryItemApi, ReportMoneyCardApi, ReportTrendItemApi } from "@/services/api/types";

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
});
