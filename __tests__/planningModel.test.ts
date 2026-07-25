import {
  buildCloseReviewItems,
  buildPlanningActivities,
  closeReviewPayload,
  closeActionStatus,
  cycleCompletionLabel,
  cycleProgressPercent,
  daysRemainingLabel,
  effectiveExpectedAmount,
  EMPTY_PLANNING_FORM,
  needsAttentionActivities,
  pendingCloseActivities,
  recurringPlanSummary,
  shouldShowCloseCycleCard,
  statusLabel,
  statusPayloadForActivity,
  upcomingActivities,
  validateCloseReview,
  validatePlanningForm
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

  it("orders unresolved activities by urgency", () => {
    const urgentPlanning: PlanningApiResponse = {
      ...planning,
      commitments: [
        { ...commitmentItem, dueDay: 8, id: 21, name: "Later", status: { actualAmount: null, status: "PENDING" } },
        { ...commitmentItem, dueDay: 1, id: 22, name: "Overdue", status: { actualAmount: null, status: "PENDING" } }
      ],
      incomeTemplates: [{ ...incomeItem, dueDay: 4, id: 11, name: "Tomorrow" }]
    };

    const activities = buildPlanningActivities(urgentPlanning);
    const attention = needsAttentionActivities(activities, urgentPlanning.cycle, new Date(2026, 6, 3));

    expect(attention.map((activity) => activity.name)).toEqual(["Overdue", "Tomorrow"]);
  });

  it("hides needs attention when no unresolved item is urgent", () => {
    const calmPlanning: PlanningApiResponse = {
      ...planning,
      commitments: [{ ...commitmentItem, dueDay: 20, id: 21, status: { actualAmount: null, status: "PENDING" } }],
      incomeTemplates: []
    };

    expect(needsAttentionActivities(buildPlanningActivities(calmPlanning), calmPlanning.cycle, new Date(2026, 6, 3))).toEqual([]);
  });

  it("shows upcoming items without duplicating attention items", () => {
    const mixedPlanning: PlanningApiResponse = {
      ...planning,
      commitments: [
        { ...commitmentItem, dueDay: 1, id: 21, name: "Overdue", status: { actualAmount: null, status: "PENDING" } },
        { ...commitmentItem, dueDay: 8, id: 22, name: "Upcoming", status: { actualAmount: null, status: "PENDING" } }
      ],
      incomeTemplates: []
    };
    const activities = buildPlanningActivities(mixedPlanning);
    const attention = needsAttentionActivities(activities, mixedPlanning.cycle, new Date(2026, 6, 3));

    expect(upcomingActivities(activities, mixedPlanning.cycle, attention, 5, new Date(2026, 6, 3)).map((activity) => activity.name)).toEqual(["Upcoming"]);
  });

  it("summarizes recurring plan counts and totals", () => {
    expect(recurringPlanSummary(planning)).toEqual({
      commitmentCount: 1,
      commitmentTotal: 1200,
      incomeCount: 1,
      incomeTotal: 3000
    });
  });

  it("shows close-cycle card near cycle end or when all items are resolved", () => {
    expect(shouldShowCloseCycleCard(planning.cycle, { daysRemaining: 4 }, 2)).toBe(true);
    expect(shouldShowCloseCycleCard(planning.cycle, { daysRemaining: 12 }, 0)).toBe(true);
    expect(shouldShowCloseCycleCard(planning.cycle, { daysRemaining: 12 }, 2)).toBe(false);
    expect(shouldShowCloseCycleCard({ ...planning.cycle, status: "Completed" }, { daysRemaining: 0 }, 0)).toBe(false);
  });

  it("uses backend-provided activities before rebuilding them on mobile", () => {
    const backendPlanning: PlanningApiResponse = {
      ...planning,
      activities: [
        {
          ...incomeItem,
          actualAmount: 3000,
          completeLabel: "Received",
          completeStatus: "RECEIVED",
          dueDate: "2026-07-01",
          effectiveExpectedAmount: 3500,
          icon: "cash",
          kind: "income",
          statusLabel: "Completed",
          timelineLabel: "Today"
        }
      ]
    };

    expect(buildPlanningActivities(backendPlanning)).toMatchObject([
      {
        actualAmount: 3000,
        expectedAmount: 3500,
        statusLabel: "Completed",
        timelineLabel: "Today"
      }
    ]);
  });

  it("builds a backend close-cycle review payload", () => {
    const [item] = buildCloseReviewItems(buildPlanningActivities(planning));
    if (!item) {
      throw new Error("Expected a pending item.");
    }

    expect(closeReviewPayload([{ ...item, action: "Carry Forward", amount: "3000" }])).toEqual({
      items: [
        {
          action: "Carry Forward",
          amount: 3000,
          id: 10,
          type: "income"
        }
      ]
    });
  });
  it("validates planning form input", () => {
    expect(validatePlanningForm(EMPTY_PLANNING_FORM)).toBe("Name is required.");
    expect(validatePlanningForm({ ...EMPTY_PLANNING_FORM, name: "Rent" })).toBe("Choose an account.");
    expect(validatePlanningForm({ ...EMPTY_PLANNING_FORM, accountId: 1, amount: "0", name: "Rent" })).toBe("Amount must be greater than zero.");
    expect(validatePlanningForm({ ...EMPTY_PLANNING_FORM, accountId: 1, amount: "10", dueDay: "32", name: "Rent" })).toBe("Due day must be between 1 and 31.");
    expect(validatePlanningForm({ ...EMPTY_PLANNING_FORM, accountId: 1, amount: "10", dueDay: "10", name: "Rent" })).toBeNull();
  });

  it("builds status payloads for primary status actions", () => {
    const [activity] = buildPlanningActivities(planning);
    if (!activity) {
      throw new Error("Expected activity.");
    }

    expect(statusPayloadForActivity(activity, planning.cycle, activity.completeStatus, activity.actualAmount)).toEqual({
      actualAmount: 3000,
      month: 7,
      status: "RECEIVED",
      year: 2026
    });
  });
});
