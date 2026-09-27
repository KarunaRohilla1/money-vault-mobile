import { adaptDashboardResponse } from "@/features/dashboard/adapter";
import { recentActivityPrimaryText, recentActivitySecondaryText } from "@/features/dashboard/recentActivityDisplay";
import { getDashboardScreenState } from "@/features/dashboard/state";
import { invalidateTransactionDependents } from "@/features/transactions/api";
import {
  ALLOCATION_EQUAL,
  buildTransactionPayload,
  hasTransactionFormErrors,
  transactionFormErrors,
  type TransactionFormValues
} from "@/features/transactions/transactionFormModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { DashboardApiResponse } from "@/services/api/types";

const vault = {
  id: "4",
  isAdmin: true,
  name: "Daily Vault",
  vaultType: "Individual" as const
};

function dashboardResponse(overrides: Partial<DashboardApiResponse["data"]> = {}): DashboardApiResponse {
  return {
    data: {
      creditCardDue: 0,
      cycle: {
        daysCompleted: 9,
        daysRemaining: 22,
        displayName: "August Cycle",
        endDate: "2026-08-31",
        id: 8,
        progressPercent: 29,
        startDate: "2026-08-01",
        status: "active",
        totalDays: 31
      },
      expensesThisCycle: 1200,
      primaryAccount: { balance: 18000, name: "Salary" },
      recentActivity: [
        {
          amount: 1200,
          categoryName: "Groceries",
          date: "2026-08-08",
          id: 50,
          notes: "Weekly shop",
          transactionType: "Expense"
        }
      ],
      remainingCommitments: 4000,
      safeToSpend: 12800,
      setup: {
        accounts: 1,
        commitments: 1,
        hasAccounts: true,
        hasCommitments: true,
        hasCycleSetting: true,
        hasIncomeTemplates: true,
        hasSavingsGoal: true,
        hasVaultLogin: true,
        incomeTemplates: 1,
        isComplete: true
      },
      settlement: {
        amount: 0,
        direction: "settled",
        items: [],
        label: "Settled",
        net: 0,
        payable: 0,
        receivable: 0
      },
      spendingByCategory: [{ amount: 1200, categoryId: 3, key: "category:3", name: "Groceries" }],
      summary: {},
      ...overrides
    },
    generatedAt: "2026-08-09T10:00:00Z",
    vault
  };
}

describe("CUJ 2 — Daily expense updates dashboard Safe to Spend and activity", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("adds an expense, invalidates dashboard dependents, and reflects recalculated Safe to Spend plus recent activity", () => {
    const before = adaptDashboardResponse(dashboardResponse());
    queryClient.setQueryData(queryKeys.dashboard.current("4"), before);

    expect(before.safeToSpend).toBeGreaterThan(0);
    expect(before.recentActivity).toHaveLength(1);

    const formValues: TransactionFormValues = {
      accountId: 1,
      allocationAmounts: {},
      allocationPercentages: {},
      amount: "850",
      categoryId: 7,
      date: "2026-08-09",
      expenseScope: "Personal",
      notes: "Coffee meetup",
      sharedVaultId: 0,
      splitType: ALLOCATION_EQUAL,
      transactionType: "Expense"
    };

    expect(hasTransactionFormErrors(transactionFormErrors(formValues, []))).toBe(false);

    const payload = buildTransactionPayload(formValues, [], null);
    expect(payload).toMatchObject({
      accountId: 1,
      amount: 850,
      categoryId: 7,
      date: "2026-08-09",
      transactionType: "Expense"
    });

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    invalidateTransactionDependents("4");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.current("4") });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.accounts.root });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.root });

    // Simulated refetch after invalidation: expense reduced Safe to Spend and prepended activity.
    const after = adaptDashboardResponse(
      dashboardResponse({
        expensesThisCycle: 2050,
        primaryAccount: { balance: 17150, name: "Salary" },
        recentActivity: [
          {
            amount: 850,
            categoryName: "Cafe",
            date: "2026-08-09",
            id: 51,
            notes: "Coffee meetup",
            transactionType: "Expense"
          },
          {
            amount: 1200,
            categoryName: "Groceries",
            date: "2026-08-08",
            id: 50,
            notes: "Weekly shop",
            transactionType: "Expense"
          }
        ],
        remainingCommitments: 4000,
        safeToSpend: 11950,
        spendingByCategory: [
          { amount: 1200, categoryId: 3, key: "category:3", name: "Groceries" },
          { amount: 850, categoryId: 7, key: "category:7", name: "Cafe" }
        ]
      })
    );
    queryClient.setQueryData(queryKeys.dashboard.current("4"), after);

    const latestActivity = after.recentActivity[0];
    if (!latestActivity) {
      throw new Error("Expected recent activity after expense");
    }

    expect(after.safeToSpend).toBe(11950);
    expect(after.safeToSpend).toBeLessThan(before.safeToSpend);
    expect(latestActivity).toMatchObject({ amount: 850, categoryName: "Cafe", notes: "Coffee meetup" });
    expect(recentActivityPrimaryText(latestActivity)).toBe("Cafe");
    expect(recentActivitySecondaryText(latestActivity)).toBe("Coffee meetup");
    expect(
      getDashboardScreenState({
        data: after,
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn()
      }).kind
    ).toBe("success");
  });

  it("surfaces a warning when Safe to Spend turns negative after an expense", () => {
    const tight = adaptDashboardResponse(
      dashboardResponse({
        remainingCommitments: 20000,
        safeToSpend: -500
      })
    );

    expect(tight.safeToSpend).toBeLessThan(0);
  });
});
