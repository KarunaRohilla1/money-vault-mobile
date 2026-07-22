import {
  buildCloseReviewItems,
  buildPlanningActivities,
  closeActionStatus,
  cycleCompletionLabel,
  cycleProgressPercent,
  daysRemainingLabel,
  effectiveExpectedAmount,
  pendingCloseActivities,
  statusLabel,
  validateCloseReview
} from "@/features/planning/planningModel";
import type { PlanningApiResponse, PlanningItemApi } from "@/services/api/types";

const incomeItem: PlanningItemApi = {
  accountId: 1,
  accountName: "Checking",
  amount: 3000,
  dueDay: 1,
  id: 10,
  name: "Salary",
  status: {
    actualAmount: null,
    notes: null,
    status: "PENDING"
  }
};

const commitmentItem: PlanningItemApi = {
  accountId: 2,
  accountName: "Bills",
  amount: 1200,
  dueDay: 5,
  id: 20,
  name: "Rent",
  status: {
    actualAmount: 1250,
    notes: null,
    status: "PAID"
  }
};

const planning: PlanningApiResponse = {
  commitments: [commitmentItem],
  cycle: {
    endDate: "2026-07-31",
    id: 1,
    startDate: "2026-07-01",
    startMonth: 7,
    startYear: 2026,
    status: "Current",
    vaultId: 1
  },
  incomeTemplates: [incomeItem],
  totals: {
    commitmentsCompleted: 1250,
    commitmentsPlanned: 1200,
    expenses: 200,
    income: 3000,
    incomePlanned: 3000,
    incomeReceived: 0,
    plannedCommitments: 1200,
    projectedSavings: 1600,
    remainingCommitments: 0,
    savingsGoal: 500
  }
};

describe("planning model", () => {
  it("keeps legacy activity ordering by due day", () => {
    expect(buildPlanningActivities(planning).map((activity) => `${activity.kind}:${activity.id}`)).toEqual(["income:10", "commitment:20"]);
  });

  it("uses actual amount as effective expected unless cancelled", () => {
    expect(effectiveExpectedAmount(commitmentItem)).toBe(1250);
    expect(effectiveExpectedAmount({ ...commitmentItem, status: { actualAmount: 0, status: "CANCELLED" } })).toBe(1200);
  });

  it("maps legacy status labels", () => {
    expect(statusLabel("RECEIVED", "income")).toBe("Received");
    expect(statusLabel("PAID", "commitment")).toBe("Paid");
    expect(statusLabel("CANCELLED", "income")).toBe("Cancelled");
    expect(statusLabel("CARRIED_FORWARD", "commitment")).toBe("Carried");
    expect(statusLabel("PENDING", "income")).toBe("Pending");
  });

  it("builds pending close review items from pending and carried activities", () => {
    const activities = buildPlanningActivities(planning);

    expect(pendingCloseActivities(activities)).toHaveLength(1);
    expect(buildCloseReviewItems(activities)).toMatchObject([{ action: null, amount: "3000" }]);
  });

  it("validates the legacy close review requirements", () => {
    const [item] = buildCloseReviewItems(buildPlanningActivities(planning));
    if (!item) {
      throw new Error("Expected a pending close item.");
    }

    expect(validateCloseReview([item])).toBe("Please choose an action for every pending item.");
    expect(validateCloseReview([{ ...item, action: "Paid", amount: "0" }])).toBe("Paid and carried items must have an amount greater than zero.");
    expect(validateCloseReview([{ ...item, action: "Cancelled", amount: "0" }])).toBeNull();
  });

  it("maps close actions to legacy statuses", () => {
    expect(closeActionStatus("Paid", "income")).toBe("RECEIVED");
    expect(closeActionStatus("Paid", "commitment")).toBe("PAID");
    expect(closeActionStatus("Cancelled", "income")).toBe("CANCELLED");
    expect(closeActionStatus("Carry Forward", "commitment")).toBe("CARRIED_FORWARD");
  });

  it("formats cycle progress values from backend cycle fields", () => {
    const cycle = { daysCompleted: 7, daysRemaining: 23, progressPercent: 23, totalDays: 30 };

    expect(cycleProgressPercent(cycle)).toBe(23);
    expect(cycleCompletionLabel(cycle)).toBe("7/30 days");
    expect(daysRemainingLabel(cycle)).toBe("23 days");
  });
});
