import { isValidElement, type ReactElement, type ReactNode } from "react";

import {
  activeFilterCount,
  activeFilterSummary,
  adaptSpendingAnalytics,  formatAnalyticsDateLabel
} from "@/features/reports/analytics/analyticsAdapter";
import { analysisDimensions, type AnalysisDimension } from "@/features/reports/analytics/analyticsState";
import { SpendingDimensionSelector } from "@/features/reports/components/spending/SpendingDimensionSelector";
import { SpendingFilterButton } from "@/features/reports/components/spending/SpendingFilterButton";
import { SpendingSummarySection } from "@/features/reports/components/spending/SpendingSummarySection";
import type { ReportSpendingApiResponse, ReportSpendingSummaryMetricApi } from "@/services/api/types";

jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: "MaterialCommunityIcons" }));
jest.mock("react-native", () => ({
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  Text: "Text",
  View: "View",
  useWindowDimensions: () => ({ fontScale: 1, width: 390 })
}));

const summaryFixtures: Record<AnalysisDimension, ReportSpendingSummaryMetricApi[]> = {
  accounts: [
    { caption: "Cash that left accounts", format: "money", key: "total-cash-outflow", title: "Total Cash Outflow", tone: "red", value: 2034 },
    { caption: "HDFC Bank", format: "text", key: "most-used-account", title: "Most Used Account", tone: "purple", value: "HDFC Bank" },
    { caption: "Highest funded spending", format: "money", key: "highest-spending-account", title: "Highest Spending Account", tone: "red", value: 1600 }
  ],
  categories: [
    { caption: "vs Jun 2026", format: "money", key: "total-spent", title: "Total Spent", tone: "red", value: 2034 },
    { caption: "vs Jun 2026", format: "money", key: "daily-average", title: "Daily Average", tone: "red", value: 65.61 },
    { caption: "2026-07-22", format: "money", key: "highest-day", title: "Highest Day", tone: "orange", value: 450 },
    { caption: "vs Jun 2026", format: "count", key: "transactions", title: "Transactions", tone: "blue", value: 29 }
  ],
  merchants: [
    { caption: "Places visited", format: "count", key: "unique-merchants", title: "Unique Merchants", tone: "purple", value: 5 },
    { caption: "Largest share", format: "text", key: "top-merchant", title: "Top Merchant", tone: "purple", value: "Swiggy" },
    { caption: "Single highest spend", format: "money", key: "largest-transaction", title: "Largest Transaction", tone: "red", value: 564 },
    { caption: "Mean spend", format: "money", key: "average-per-merchant", title: "Average per Merchant", tone: "purple", value: 406.8 },
    { caption: "Extra test metric", format: "count", key: "merchant-extra", title: "Extra Metric", tone: "purple", value: 1 }
  ],
  paymentModes: [
    { caption: "Most frequent", format: "text", key: "most-used-mode", title: "Most Used Mode", tone: "purple", value: "UPI" },
    { caption: "Highest funded spend", format: "money", key: "highest-spend-mode", title: "Highest Spend Mode", tone: "red", value: 1024 },
    { caption: "Cards", format: "money", key: "credit-card-spend", title: "Credit Card Spend", tone: "red", value: 700 },
    { caption: "Cash and other", format: "money", key: "other-spend", title: "Other Spend", tone: "purple", value: 50 }
  ]
};

function spendingResponse(dimension: AnalysisDimension, summary = summaryFixtures[dimension]): ReportSpendingApiResponse {
  return {
    data: {
      breakdown: {
        rows: [
          { amount: 1200, icon: "food", id: "row-1", key: "row-1", label: "Dining Out", percent: 59, subLabel: "3 transactions", transactionCount: 3 }
        ],
        title: dimension === "categories" ? "Spending by Category" : "Breakdown"
      },
      metadata: {
        dimension,
        emptyMessage: "No spending for this analysis.",
        emptyTitle: "No spending",
        filterOptions: { accounts: ["HDFC"], categories: ["Dining Out"], merchants: ["Swiggy"], paymentModes: ["UPI"] },
        question: "Where is my money going?"
      },
      summary,
      trend: { points: [{ amount: 2034, date: "2026-07-22", label: "22" }], title: "Spending Trend" },
      visualization: {
        items: [{ amount: 1200, color: "#8B5CF6", icon: "food", id: "row-1", key: "row-1", label: "Dining Out", percent: 59, transactionCount: 3 }],
        title: "Spending by Category",
        total: 2034,
        type: "donut"
      }
    },
    filters: { cycleStart: "2026-07-01", endDate: "2026-07-31", period: "cycle", startDate: "2026-07-01" },
    generatedAt: "2026-07-22T00:00:00Z",
    vault: { id: "1", isAdmin: true, name: "KR", vaultType: "Individual" }
  };
}

function flattenElements(node: ReactNode): ReactElement[] {
  if (Array.isArray(node)) {
    return node.flatMap(flattenElements);
  }
  if (!isValidElement(node)) {
    return [];
  }
  const props = node.props as { children?: ReactNode };
  return [node, ...flattenElements(props.children)];
}

describe("reports spending presentation", () => {
  it("models analysis dimensions as one mutually exclusive selector without filters", () => {
    expect(analysisDimensions.map((dimension) => dimension.key)).toEqual(["categories", "merchants", "accounts", "paymentModes"]);
    expect(analysisDimensions.some((dimension) => dimension.label === "Filters")).toBe(false);
  });

  it("announces selected dimension state", () => {
    const tree = SpendingDimensionSelector({ active: "categories", onSelect: jest.fn() });
    const elements = flattenElements(tree);
    expect(elements.some((element) => {
      const props = element.props as { accessibilityLabel?: string; accessibilityState?: { selected?: boolean } };
      return props.accessibilityLabel === "Categories analysis selected" && props.accessibilityState?.selected === true;
    })).toBe(true);
  });

  it("renders filters through a separate secondary control with active count", () => {
    const tree = SpendingFilterButton({ filters: { account: "HDFC", category: "Dining Out" }, onPress: jest.fn() });
    const elements = flattenElements(tree);
    expect(elements.some((element) => {
      const props = element.props as { accessibilityLabel?: string; accessibilityState?: { selected?: boolean } };
      return props.accessibilityLabel === `Filters ${String.fromCharCode(183)} 2. Opens spending filters.` && props.accessibilityState?.selected === true;
    })).toBe(true);
  });

  it("removes the large enclosing summary card from the active summary section", () => {
    const model = adaptSpendingAnalytics(spendingResponse("categories"));
    if (!model) {
      throw new Error("Expected spending model.");
    }
    const tree = SpendingSummarySection({ currencyCode: "INR", locale: "en-IN", summary: model.summarySection });
    const [root] = flattenElements(tree);
    expect((root?.props as { className?: string } | undefined)?.className).toBe("gap-3");
  });

  it.each([
    ["categories", "Category Summary", "Where your spending went"],
    ["merchants", "Merchant Summary", "Who you spent with"],
    ["accounts", "Account Summary", "Which accounts funded spending"],
    ["paymentModes", "Payment Mode Summary", "How you paid"]
  ] as const)("uses dimension-aware summary copy for %s", (dimension, title, subtitle) => {
    const model = adaptSpendingAnalytics(spendingResponse(dimension));
    expect(model?.summarySection.title).toBe(title);
    expect(model?.summarySection.subtitle).toBe(subtitle);
  });

  it("supports three, four, and five metric responses", () => {
    expect(adaptSpendingAnalytics(spendingResponse("accounts"))?.summarySection.metrics).toHaveLength(3);
    expect(adaptSpendingAnalytics(spendingResponse("categories"))?.summarySection.metrics).toHaveLength(4);
    expect(adaptSpendingAnalytics(spendingResponse("merchants"))?.summarySection.metrics).toHaveLength(5);
  });

  it("uses semantic metric icons instead of one generic repeated icon", () => {
    const categoryIcons = adaptSpendingAnalytics(spendingResponse("categories"))?.summarySection.metrics.map((metric) => metric.iconName) ?? [];
    expect(new Set(categoryIcons).size).toBeGreaterThan(1);
    expect(categoryIcons).not.toEqual(categoryIcons.map(() => "chart-box-outline"));
  });

  it("formats ISO dates as en-IN friendly labels", () => {
    expect(formatAnalyticsDateLabel("2026-07-22", "en-IN")).toBe("22 Jul 2026");
    expect(formatAnalyticsDateLabel("Already formatted", "en-IN")).toBe("Already formatted");
  });



  it("summarizes active filters without rendering a large chip set", () => {
    const filters = { account: "HDFC", amountMin: 100, category: "Dining Out", merchant: undefined };
    expect(activeFilterCount(filters)).toBe(3);
    expect(activeFilterSummary(filters)).toBe(`HDFC ${String.fromCharCode(183)} 100 +1`);
  });

  it("keeps dimension changes updating summary, visualization, trend, and breakdown together", () => {
    const categories = adaptSpendingAnalytics(spendingResponse("categories"));
    const merchants = adaptSpendingAnalytics(spendingResponse("merchants"));
    expect(categories?.summarySection.title).toBe("Category Summary");
    expect(merchants?.summarySection.title).toBe("Merchant Summary");
    expect(categories?.chart.title).toBe("Spending by Category");
    expect(merchants?.chart.items[0]?.label).toBe("Dining Out");
    expect(merchants?.trend.title).toBe("Spending Trend");
    expect(merchants?.breakdown.rows[0]?.label).toBe("Dining Out");
  });

  it("does not introduce replacement-character text in model output", () => {
    const model = adaptSpendingAnalytics(spendingResponse("paymentModes"));
    const renderedText = JSON.stringify(model);
    expect(renderedText).not.toContain("\uFFFD");
    expect(renderedText).not.toContain(String.fromCharCode(0xfffd));
  });
});
