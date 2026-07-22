import {
  dashboardComfortCopy,
  dashboardCycleInfoLabel,
  dashboardHeaderDateLabel,
  dashboardLayout,
  dashboardMetricLabels,
  dashboardVisualRules,
  dashboardWidthRules,
  formatDashboardMoney,
  singleLineMoneyProps
} from "@/features/dashboard/dashboardLayout";

describe("dashboard responsive layout", () => {
  it("formats dashboard money with Indian grouping and preserves fractional values", () => {
    expect(formatDashboardMoney(999, "INR", "en-IN")).toBe("₹999");
    expect(formatDashboardMoney(50000, "INR", "en-IN")).toBe("₹50,000");
    expect(formatDashboardMoney(199000, "INR", "en-IN")).toBe("₹1,99,000");
    expect(formatDashboardMoney(1250000, "INR", "en-IN")).toBe("₹12,50,000");
    expect(formatDashboardMoney(12345678, "INR", "en-IN")).toBe("₹1,23,45,678");
    expect(formatDashboardMoney(100.5, "INR", "en-IN")).toBe("₹100.50");
  });

  it("uses single-line scaling rules for critical money values", () => {
    expect(singleLineMoneyProps.numberOfLines).toBe(1);
    expect(singleLineMoneyProps.adjustsFontSizeToFit).toBe(true);
    expect(singleLineMoneyProps.minimumFontScale).toBeLessThan(0.8);
  });

  it("does not reserve bottom navigation clearance inside the Dashboard screen", () => {
    expect(dashboardLayout.bottomClearanceClassName).toBe("gap-5");
  });

  it("keeps responsive graph sizing for narrow and normal Android widths", () => {
    expect(dashboardWidthRules(360)).toEqual({
      heroGraphWidth: 138,
      isNarrow: true,
      snapshotUsesTwoColumns: true
    });
    expect(dashboardWidthRules(430)).toEqual({
      heroGraphWidth: 168,
      isNarrow: false,
      snapshotUsesTwoColumns: true
    });
  });

  it("does not render a settings or gear overlay on Dashboard", () => {
    expect(dashboardVisualRules.settingsGearOverlayEnabled).toBe(false);
  });

  it("keeps removed Dashboard sections disabled", () => {
    expect(dashboardVisualRules.showNeedsAttentionSection).toBe(false);
    expect(dashboardVisualRules.showSavingsGoalSection).toBe(false);
  });

  it("keeps the comfort copy concise and non-duplicated", () => {
    expect(dashboardComfortCopy).toEqual({
      headline: "You're comfortable",
      secondary: "within your spending plan."
    });
    expect(dashboardComfortCopy.secondary).not.toContain(dashboardComfortCopy.headline);
  });

  it("exposes all financial snapshot metrics without narrow-column abbreviations", () => {
    expect(dashboardMetricLabels).toEqual([
      "Available Balance",
      "Expenses This Cycle",
      "Remaining Commitments",
      "Credit Card Due"
    ]);
  });

  it("does not manually truncate spending category labels", () => {
    expect(dashboardVisualRules.categoryLabelsAreManualTruncated).toBe(false);
  });

  it("formats compact Dashboard header date and cycle information", () => {
    expect(dashboardHeaderDateLabel(new Date("2026-07-22T08:00:00Z"), "en-IN")).toContain("22 July");
    expect(
      dashboardCycleInfoLabel(
        {
          daysCompleted: 5,
          endDate: "2026-07-31",
          startDate: "2026-07-18"
        },
        "en-IN"
      )
    ).toBe("Day 5 - 18 Jul - 31 Jul");
  });
});
