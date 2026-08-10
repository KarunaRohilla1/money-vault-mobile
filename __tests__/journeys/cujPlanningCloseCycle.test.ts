import { invalidatePlanningDependents } from "@/features/planning/api";
import {
  buildCloseReviewItems,
  buildPlanningActivities,
  closeReviewPayload,
  pendingCloseActivities,
  recurringPlanSummary,
  statusPayloadForActivity,
  validateCloseReview,
  validatePlanningForm
} from "@/features/planning/planningModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { notifyNotificationDomainChanged } from "@/features/notifications/services/notificationEngine";
import type { PlanningApiResponse, PlanningItemApi } from "@/services/api/types";

jest.mock("@/features/notifications/services/notificationEngine", () => ({
  notificationEngine: {
    dispose: jest.fn(),
    initialize: jest.fn(),
    reevaluate: jest.fn()
  },
  notifyNotificationDomainChanged: jest.fn()
}));

const rent: PlanningItemApi = {
  accountId: 2,
  accountName: "Bills",
  amount: 15000,
  dueDay: 5,
  id: 20,
  name: "Rent",
  status: {
    actualAmount: null,
    notes: null,
    status: "PENDING"
  }
};

const salary: PlanningItemApi = {
  accountId: 1,
  accountName: "Salary",
  amount: 50000,
  dueDay: 1,
  id: 10,
  name: "Salary",
  status: {
    actualAmount: null,
    notes: null,
    status: "PENDING"
  }
};

function planningWith(commitments: PlanningItemApi[], incomeTemplates: PlanningItemApi[] = [salary]): PlanningApiResponse {
  return {
    commitments,
    cycle: {
      daysRemaining: 0,
      endDate: "2026-07-31",
      id: 1,
      startDate: "2026-07-01",
      startMonth: 7,
      startYear: 2026,
      status: "Current",
      vaultId: 1
    },
    incomeTemplates,
    totals: {
      commitmentsCompleted: 0,
      commitmentsPlanned: commitments.reduce((sum, item) => sum + item.amount, 0),
      expenses: 0,
      income: 0,
      incomePlanned: incomeTemplates.reduce((sum, item) => sum + item.amount, 0),
      incomeReceived: 0,
      plannedCommitments: commitments.reduce((sum, item) => sum + item.amount, 0),
      projectedSavings: 0,
      remainingCommitments: commitments
        .filter((item) => item.status.status === "PENDING")
        .reduce((sum, item) => sum + item.amount, 0),
      savingsGoal: 5000
    }
  };
}

describe("CUJ 3 — Planning recurring commitment through close cycle carry-forward", () => {
  beforeEach(() => {
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it("creates a recurring commitment, marks an obligation paid, closes the cycle, and carries remaining work forward", () => {
    // Create recurring commitment (form → model obligations).
    expect(
      validatePlanningForm({
        accountId: 2,
        amount: "15000",
        dueDay: "5",
        id: null,
        kind: "commitment",
        name: "Rent"
      })
    ).toBeNull();

    const openCycle = planningWith([rent]);
    expect(recurringPlanSummary(openCycle)).toMatchObject({
      commitmentCount: 1,
      commitmentTotal: 15000
    });

    const activities = buildPlanningActivities(openCycle);
    expect(activities.map((activity) => `${activity.kind}:${activity.name}`)).toEqual(["income:Salary", "commitment:Rent"]);
    expect(pendingCloseActivities(activities)).toHaveLength(2);

    // Mark rent obligation paid mid-cycle.
    const rentActivity = activities.find((activity) => activity.kind === "commitment");
    if (!rentActivity) {
      throw new Error("Expected rent activity");
    }

    const paidPayload = statusPayloadForActivity(rentActivity, openCycle.cycle, "PAID", 15000);
    expect(paidPayload).toEqual({
      actualAmount: 15000,
      month: 7,
      status: "PAID",
      year: 2026
    });

    const paidRent: PlanningItemApi = {
      ...rent,
      status: { actualAmount: 15000, notes: null, status: "PAID" }
    };
    const utilities: PlanningItemApi = {
      accountId: 2,
      accountName: "Bills",
      amount: 2200,
      dueDay: 28,
      id: 21,
      name: "Utilities",
      status: { actualAmount: null, notes: null, status: "PENDING" }
    };

    // Close financial cycle: only unresolved obligations remain for review; utilities carry forward.
    const closing = planningWith([paidRent, utilities], [
      {
        ...salary,
        status: { actualAmount: 50000, notes: null, status: "RECEIVED" }
      }
    ]);
    const pendingAtClose = pendingCloseActivities(buildPlanningActivities(closing));
    expect(pendingAtClose.map((activity) => activity.name)).toEqual(["Utilities"]);

    const closeItems = buildCloseReviewItems(buildPlanningActivities(closing)).map((item) => ({
      ...item,
      action: "Carry Forward" as const,
      amount: "2200"
    }));

    expect(validateCloseReview(closeItems)).toBeNull();

    const body = closeReviewPayload(closeItems);
    expect(body.items).toEqual([
      expect.objectContaining({ action: "Carry Forward", amount: 2200, id: 21, type: "commitment" })
    ]);

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    invalidatePlanningDependents("1");

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.planning.root });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.current("1") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.accounts.root });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.root });
    expect(notifyNotificationDomainChanged).toHaveBeenCalledTimes(1);
  });

  it("does not allow closing when an obligation is unresolved", () => {
    const items = buildCloseReviewItems(buildPlanningActivities(planningWith([rent])));
    expect(validateCloseReview(items)).toBeTruthy();
  });
});
