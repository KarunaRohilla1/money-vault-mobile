import { adaptDashboardResponse } from "@/features/dashboard/adapter";
import type { DashboardApiResponse } from "@/services/api/types";

const baseResponse: DashboardApiResponse = {
  data: {
    creditCardDue: 120,
    cycle: {
      daysCompleted: 10,
      daysRemaining: 20,
      displayName: "July Cycle",
      endDate: "2026-07-31",
      id: 7,
      progressPercent: 33,
      startDate: "2026-07-01",
      status: "active",
      totalDays: 30
    },
    expensesThisCycle: 500,
    primaryAccount: {
      balance: 900,
      name: "Primary account"
    },
    recentActivity: [
      { amount: 1, categoryName: "A", date: "2026-07-01", id: 1, transactionType: "Expense" },
      { amount: 2, categoryName: "B", date: "2026-07-02", id: 2, transactionType: "Expense" },
      { amount: 3, categoryName: "C", date: "2026-07-03", id: 3, transactionType: "Expense" },
      { amount: 4, categoryName: "D", date: "2026-07-04", id: 4, transactionType: "Expense" },
      { amount: 5, categoryName: "E", date: "2026-07-05", id: 5, transactionType: "Expense" },
      { amount: 6, categoryName: "F", date: "2026-07-06", id: 6, transactionType: "Expense" }
    ],
    remainingCommitments: 80,
    safeToSpend: 300,
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
      amount: 25,
      direction: "payable",
      items: [],
      label: "You owe",
      net: -25,
      payable: 25,
      receivable: 0
    },
    spendingByCategory: [{ amount: 100, categoryId: 10, key: "category:10", name: "Food" }],
    summary: {}
  },
  generatedAt: "2026-07-14T00:00:00Z",
  vault: {
    id: "1",
    isAdmin: true,
    name: "Vault Under Test",
    vaultType: "Individual"
  }
};

describe("dashboard adapter", () => {
  it("maps generatedAt, vault, and nested dashboard data", () => {
    const viewModel = adaptDashboardResponse(baseResponse);

    expect(viewModel.generatedAt).toBe(baseResponse.generatedAt);
    expect(viewModel.vault).toEqual(baseResponse.vault);
    expect(viewModel.cycleLabel).toBe("July Cycle");
  });

  it("maps primary account and safe-to-spend metrics", () => {
    const viewModel = adaptDashboardResponse(baseResponse);

    expect(viewModel.primaryAccountName).toBe("Primary account");
    expect(viewModel.primaryAccountBalance).toBe(900);
    expect(viewModel.safeToSpend).toBe(300);
  });

  it("limits recent activity to five rows", () => {
    const viewModel = adaptDashboardResponse(baseResponse);

    expect(viewModel.recentActivity).toHaveLength(5);
    expect(viewModel.recentActivity.map((item) => item.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps empty spending categories safe", () => {
    const viewModel = adaptDashboardResponse({
      ...baseResponse,
      data: {
        ...baseResponse.data,
        spendingByCategory: []
      }
    });

    expect(viewModel.categories).toEqual([]);
  });

  it("preserves backend category IDs and activity direction fields", () => {
    const viewModel = adaptDashboardResponse({
      ...baseResponse,
      data: {
        ...baseResponse.data,
        recentActivity: [
          {
            amount: 100,
            categoryName: "Transfer",
            date: "2026-07-01",
            direction: "credit",
            id: 1,
            signedAmount: 100,
            transactionType: "Transfer In"
          }
        ],
        spendingByCategory: [
          { amount: 50, categoryId: 10, key: "category:10", name: "Food" },
          { amount: 25, categoryId: 11, key: "category:11", name: "Food" },
          { amount: 5, categoryId: null, key: "uncategorized", name: "Uncategorized" }
        ]
      }
    });

    expect(viewModel.recentActivity[0]).toMatchObject({ direction: "credit", signedAmount: 100 });
    expect(viewModel.categories.map((category) => category.key)).toEqual(["category:10", "category:11", "uncategorized"]);
  });

  it("rejects invalid successful dashboard responses", () => {
    expect(() => adaptDashboardResponse({ data: {}, generatedAt: "2026-07-14T00:00:00Z", vault: baseResponse.vault } as DashboardApiResponse)).toThrow(
      "The dashboard response was incomplete."
    );
  });
});
