import {
  buildPlanningSummaryPresentation,
  planningSummaryAccessibilityLabels,
  savingsDifferenceLabel
} from "@/features/planning/summaryPresentation";
import { formatCurrency } from "@/lib/format";
import type { PlanningTotalsApi } from "@/services/api/types";

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");

const totals: PlanningTotalsApi = {
  commitmentsCompleted: 4000,
  commitmentsPlanned: 4210,
  expenses: 0,
  income: 130000,
  incomePlanned: 120000,
  incomeReceived: 130000,
  plannedCommitments: 4210,
  projectedSavings: 125990,
  remainingCommitments: 210,
  savingsGoal: 20000
};

describe("planning summary presentation", () => {
  it("renders income received as primary and planned as secondary fields", () => {
    const source = readFileSync(join(process.cwd(), "features/planning/components/summary/IncomeSummaryCard.tsx"), "utf8");
    expect(source).toContain("totals.incomeReceived");
    expect(source).toContain("Received");
    expect(source).toContain("totals.incomePlanned");
  });

  it("allows income percentage above 100 and handles zero planned income safely", () => {
    expect(buildPlanningSummaryPresentation(totals).incomePercent).toBe(108);
    expect(buildPlanningSummaryPresentation({ ...totals, incomePlanned: 0 }).incomePercent).toBe(0);
  });

  it("renders commitment paid, remaining, planned, and percentage from backend totals", () => {
    const summary = buildPlanningSummaryPresentation(totals);
    const source = readFileSync(join(process.cwd(), "features/planning/components/summary/CommitmentsSummaryCard.tsx"), "utf8");

    expect(source).toContain("totals.commitmentsCompleted");
    expect(source).toContain("totals.remainingCommitments");
    expect(source).toContain("totals.commitmentsPlanned");
    expect(summary.commitmentPercent).toBe(95);
  });

  it("does not render a Savings card in Planning Summary", () => {
    const source = readFileSync(join(process.cwd(), "features/planning/components/summary/PlanningSummary.tsx"), "utf8");

    expect(source).not.toContain("SavingsSummaryCard");
    expect(source).not.toContain("Projected");
    expect(buildPlanningSummaryPresentation(totals).savingsDifference).toBe(105990);
    expect(savingsDifferenceLabel(100)).toBe("above goal");
    expect(savingsDifferenceLabel(-5000)).toBe("below goal");
    expect(savingsDifferenceLabel(0)).toBe("Goal met exactly");
  });

  it("formats currency using en-IN", () => {
    expect(formatCurrency(135975, "INR", "en-IN")).toContain("1,35,975");
  });

  it("removes old large full-width summary panel layout", () => {
    const source = readFileSync(join(process.cwd(), "features/planning/components/PlanningSummaryCard.tsx"), "utf8");
    expect(source).not.toContain("SummaryPanel");
    expect(source).not.toContain("MoneyLine");
  });

  it("uses one compact combined card rather than a horizontal summary strip", () => {
    const source = readFileSync(join(process.cwd(), "features/planning/components/summary/PlanningSummary.tsx"), "utf8");
    expect(source).not.toContain("ScrollView");
    expect(source).toContain("SummaryColumn");
    expect(source).toContain("w-px bg-surface-border");
    expect(source).not.toContain("PercentageBadge");
  });

  it("accessibility labels contain key values", () => {
    const labels = planningSummaryAccessibilityLabels(totals, "INR", "en-IN");

    expect(labels.income).toContain("received");
    expect(labels.income).not.toContain("percent");
    expect(labels.commitments).toContain("remaining");
    expect(labels.commitments).not.toContain("percent");
    expect("savings" in labels).toBe(false);
  });

  it("does not produce replacement characters", () => {
    const labels = planningSummaryAccessibilityLabels(totals, "INR", "en-IN");
    expect(Object.values(labels).join(" ")).not.toContain("\uFFFD");
    expect(Object.values(labels).join(" ")).not.toContain(String.fromCharCode(0xfffd));
  });

  it("keeps commitment values reconciled to backend summary semantics", () => {
    expect(totals.commitmentsPlanned - totals.commitmentsCompleted).toBe(totals.remainingCommitments);
  });
});
