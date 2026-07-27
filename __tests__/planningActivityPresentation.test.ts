import {
  activeFilterCount,
  activityAccessibilityLabel,
  compactInsightLine,
  emptyStateFor,
  filterActivities,
  getActivityMetrics,
  getActivityPresentationStatus,
  groupActivities,
  isBillActivity,
  pluralize,
  presentActivities,
  sortActivities,
  statusCounts,
  typeFilterButtonLabel,
  viewOptionsSummary
} from "@/features/planning/activityPresentation";
import type { PlanningActivityViewModel } from "@/features/planning/planningModel";
import type { PlanningCycleApi } from "@/services/api/types";

declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");

const cycle: PlanningCycleApi = {
  endDate: "2026-07-31",
  id: 1,
  startDate: "2026-07-01",
  startMonth: 7,
  startYear: 2026,
  status: "Current",
  vaultId: 1
};

function activity(overrides: Partial<PlanningActivityViewModel>): PlanningActivityViewModel {
  const kind = overrides.kind ?? "commitment";
  const completeStatus = kind === "income" ? "RECEIVED" : "PAID";
  return {
    accountId: 1,
    accountName: "HDFC Bank",
    actualAmount: overrides.expectedAmount ?? 1000,
    actualEntered: false,
    completeLabel: kind === "income" ? "Received" : "Paid",
    completeStatus,
    dueDate: "2026-07-20",
    dueDay: 20,
    expectedAmount: 1000,
    icon: "calendar-check-outline",
    id: 1,
    kind,
    name: "Rent",
    notes: null,
    status: "PENDING",
    statusLabel: "Pending",
    ...overrides
  };
}

const today = new Date(2026, 6, 10);
const rawActivities = [
  activity({ dueDate: "2026-07-05", dueDay: 5, expectedAmount: 1250, icon: "lightning-bolt-outline", id: 1, name: "Electricity Bill" }),
  activity({ dueDate: "2026-07-10", dueDay: 10, expectedAmount: 3000, id: 2, name: "Rent" }),
  activity({ dueDate: "2026-07-12", dueDay: 12, expectedAmount: 899, icon: "wifi", id: 3, name: "Internet Bill" }),
  activity({ dueDate: "2026-07-22", dueDay: 22, expectedAmount: 2400, id: 4, name: "Health Insurance" }),
  activity({ dueDate: "2026-07-01", dueDay: 1, expectedAmount: 130000, id: 5, kind: "income", name: "Salary", status: "RECEIVED", statusLabel: "Completed" }),
  activity({ dueDate: "2026-07-08", dueDay: 8, expectedAmount: 500, id: 6, name: "Skipped Fee", status: "CANCELLED", statusLabel: "Skipped" }),
  activity({ dueDate: "2026-07-09", dueDay: 9, expectedAmount: 700, id: 7, name: "Carried EMI", status: "CARRIED_FORWARD", statusLabel: "Carried Forward" })
];
const presented = presentActivities(rawActivities, cycle, today);

describe("planning activity presentation", () => {


  it("builds a compact insight line with pluralization and hidden zero fragments", () => {
    expect(compactInsightLine({ overdue: 1, pending: 2, remaining: 1000 }, "INR", "en-IN")).toContain("1 overdue");
    expect(compactInsightLine({ overdue: 1, pending: 2, remaining: 1000 }, "INR", "en-IN")).toContain("2 pending");
    expect(compactInsightLine({ overdue: 0, pending: 3, remaining: 0 }, "INR", "en-IN")).toBe("No overdue - 3 pending");
    expect(compactInsightLine({ overdue: 0, pending: 0, remaining: 0 }, "INR", "en-IN")).toBe("All activities completed");
  });

  it("summarizes active filters and view options without long main labels", () => {
    expect(activeFilterCount("pending", "all")).toBe(0);
    expect(activeFilterCount("skipped", "bill")).toBe(2);
    expect(typeFilterButtonLabel("all")).toBe("All types");
    expect(typeFilterButtonLabel("income")).toBe("Income");
    expect(viewOptionsSummary("dueDate", "dueSoonest")).toBe("Grouped by due date - Soonest first");
  });

  it("uses the compact Financial Activities layout entry points", () => {
    const source = readFileSync(join(process.cwd(), "features/planning/components/activities/FinancialActivitiesSection.tsx"), "utf8");
    expect(source).not.toContain("ActivityMetricsStrip");
    expect(source).not.toContain("ActivityInsightLine");
    expect(source).toContain("ActivityFilterButton");
    expect(source).toContain("ActivityViewOptionsButton");
  });

  it("keeps skipped out of the main status tabs but available in filters", () => {
    const tabs = readFileSync(join(process.cwd(), "features/planning/components/activities/ActivityStatusTabs.tsx"), "utf8");
    const sheet = readFileSync(join(process.cwd(), "features/planning/components/activities/ActivityFilterSheet.tsx"), "utf8");
    expect(tabs).toContain('["pending", "completed", "all"]');
    expect(tabs).not.toContain('"skipped", "all"');
    expect(sheet).toContain('["pending", "completed", "skipped", "all"]');
  });

  it("counts total, completed, pending, skipped, and overdue activities", () => {
    expect(getActivityMetrics(presented, { remainingCommitments: 6249 })).toEqual({
      completed: 1,
      overdue: 2,
      pending: 3,
      remaining: 6249,
      skipped: 1,
      total: 7
    });
    expect(statusCounts(presented)).toEqual({ all: 7, completed: 1, pending: 5, skipped: 1 });
  });

  it("uses existing remaining total instead of recalculating when provided", () => {
    expect(getActivityMetrics(presented, { remainingCommitments: 17 }).remaining).toBe(17);
  });

  it("maps persisted statuses without changing semantics", () => {
    expect(getActivityPresentationStatus(activity({ kind: "income", status: "RECEIVED" }))).toBe("completed");
    expect(getActivityPresentationStatus(activity({ kind: "commitment", status: "PAID" }))).toBe("completed");
    expect(getActivityPresentationStatus(activity({ status: "CANCELLED" }))).toBe("skipped");
    expect(getActivityPresentationStatus(activity({ status: "CARRIED_FORWARD" }))).toBe("carriedForward");
    expect(getActivityPresentationStatus(activity({ status: "PENDING" }))).toBe("pending");
  });

  it("filters pending, completed, skipped, all, income, commitments, and bills", () => {
    expect(filterActivities(presented, "pending", "all")).toHaveLength(5);
    expect(filterActivities(presented, "completed", "all").map((item) => item.name)).toEqual(["Salary"]);
    expect(filterActivities(presented, "skipped", "all").map((item) => item.name)).toEqual(["Skipped Fee"]);
    expect(filterActivities(presented, "all", "all")).toHaveLength(7);
    expect(filterActivities(presented, "all", "income").map((item) => item.name)).toEqual(["Salary"]);
    expect(filterActivities(presented, "all", "commitment").map((item) => item.name)).toEqual(["Rent", "Skipped Fee", "Carried EMI"]);
    expect(filterActivities(presented, "all", "bill").map((item) => item.name)).toEqual(["Electricity Bill", "Internet Bill", "Health Insurance"]);
  });

  it("maps bills only from real available Planning metadata", () => {
    expect(isBillActivity(activity({ icon: "wifi", name: "Internet" }))).toBe(true);
    expect(isBillActivity(activity({ icon: "calendar-check-outline", name: "Mutual Fund SIP" }))).toBe(false);
  });

  it("combines status and type filters with AND semantics", () => {
    expect(filterActivities(presented, "pending", "bill").map((item) => item.name)).toEqual(["Electricity Bill", "Internet Bill", "Health Insurance"]);
  });

  it("groups overdue, today, this week, and later buckets", () => {
    const groups = groupActivities(sortActivities(filterActivities(presented, "pending", "all"), "dueSoonest"), "dueDate", cycle);
    expect(groups.map((group) => group.label)).toEqual(["OVERDUE (2)", "DUE TODAY (1)", "DUE THIS WEEK (1)", "LATER (1)"]);
  });

  it("never marks completed or cancelled activities overdue", () => {
    const oldDone = presentActivities([
      activity({ dueDate: "2026-07-01", dueDay: 1, kind: "income", status: "RECEIVED" }),
      activity({ dueDate: "2026-07-01", dueDay: 1, status: "CANCELLED" })
    ], cycle, today);
    expect(oldDone.map((item) => item.urgency)).toEqual(["none", "none"]);
  });

  it("does not mark future-cycle activities overdue", () => {
    const future = presentActivities([activity({ dueDate: "2026-08-01", dueDay: 1 })], { ...cycle, status: "Upcoming", startMonth: 8 }, new Date(2026, 8, 1));
    expect(future[0]?.urgency).toBe("thisWeek");
    expect(future[0]?.dueLabel).toBe("Due on 1 Aug");
  });

  it("sorts by due date, amount, and name", () => {
    expect(sortActivities(presented, "dueSoonest")[0]?.name).toBe("Salary");
    expect(sortActivities(presented, "amountHighest")[0]?.name).toBe("Salary");
    expect(sortActivities(presented, "nameAsc")[0]?.name).toBe("Carried EMI");
  });

  it("returns filtered empty states", () => {
    expect(emptyStateFor("pending", "all").title).toBe("No pending activities");
    expect(emptyStateFor("all", "income").message).toBe("There are no income items in this cycle.");
  });

  it("formats accessibility labels with en-IN currency", () => {
    expect(activityAccessibilityLabel(presented[1]!, "INR", "en-IN")).toContain("3,000");
  });

  it("formats singular and plural labels", () => {
    expect(pluralize(1, "activity")).toBe("1 activity");
    expect(pluralize(2, "activity")).toBe("2 activities");
  });

  it("does not produce replacement characters in rendered labels", () => {
    const strings = presented.flatMap((item) => [item.dueLabel, item.typeLabel, activityAccessibilityLabel(item, "INR", "en-IN")]);
    expect(strings.join(" ")).not.toContain("\uFFFD");
    expect(strings.join(" ")).not.toContain(String.fromCharCode(0xfffd));
  });
});
