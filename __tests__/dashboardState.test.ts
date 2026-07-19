import { adaptDashboardResponse } from "@/features/dashboard/adapter";
import {
  DASHBOARD_CONNECTION_ERROR_MESSAGE,
  getDashboardScreenState,
  shouldClearDashboardSession
} from "@/features/dashboard/state";
import { ApiClientError } from "@/services/api/client";
import type { DashboardApiResponse } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";

const dashboardResponse: DashboardApiResponse = {
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
    recentActivity: [{ amount: 50, categoryName: "Food", date: "2026-07-01", id: 1, transactionType: "Expense" }],
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
    spendingByCategory: [{ amount: 100, name: "Food" }],
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

const dashboard = adaptDashboardResponse(dashboardResponse);
const retry = jest.fn();

describe("dashboard screen state", () => {
  beforeEach(() => {
    retry.mockClear();
    useAuthStore.setState({
      authenticatedVault: dashboard.vault,
      errorMessage: null,
      status: "authenticated",
      token: "stored-token",
      vault: dashboard.vault
    });
  });

  it("shows loading while the dashboard request is in progress", () => {
    expect(getDashboardScreenState({ data: undefined, error: null, isError: false, isLoading: true, refetch: retry })).toEqual({
      kind: "loading"
    });
  });

  it("renders successful dashboard responses", () => {
    const state = getDashboardScreenState({ data: dashboard, error: null, isError: false, isLoading: false, refetch: retry });

    expect(state).toEqual({
      dashboard,
      kind: "success"
    });
  });

  it("uses empty only for a valid empty setup response", () => {
    const emptyDashboard = adaptDashboardResponse({
      ...dashboardResponse,
      data: {
        ...dashboardResponse.data,
        recentActivity: [],
        setup: {
          ...dashboardResponse.data.setup,
          accounts: 0,
          commitments: 0,
          hasAccounts: false,
          hasCommitments: false,
          hasIncomeTemplates: false,
          incomeTemplates: 0,
          isComplete: false
        },
        spendingByCategory: []
      }
    });

    expect(getDashboardScreenState({ data: emptyDashboard, error: null, isError: false, isLoading: false, refetch: retry })).toEqual({
      kind: "empty"
    });
  });

  it("shows the connection error for network failures", () => {
    const error = new ApiClientError("Network request failed", { isNetworkError: true, status: null });
    const state = getDashboardScreenState({ data: undefined, error, isError: true, isLoading: false, refetch: retry });

    expect(state.kind).toBe("error");
    expect(state).toMatchObject({ message: DASHBOARD_CONNECTION_ERROR_MESSAGE });
  });

  it("shows the connection error for HTTP 500 failures", () => {
    const error = new ApiClientError("Server error", { isNetworkError: false, status: 500 });
    const state = getDashboardScreenState({ data: undefined, error, isError: true, isLoading: false, refetch: retry });

    expect(state.kind).toBe("error");
    expect(shouldClearDashboardSession(error)).toBe(false);
  });

  it("shows an error when no dashboard data is available without a valid empty response", () => {
    const state = getDashboardScreenState({ data: undefined, error: null, isError: false, isLoading: false, refetch: retry });

    expect(state.kind).toBe("error");
    expect(state).toMatchObject({ message: DASHBOARD_CONNECTION_ERROR_MESSAGE });
  });

  it("calls refetch from retry", () => {
    const error = new ApiClientError("Server error", { isNetworkError: false, status: 500 });
    const state = getDashboardScreenState({ data: undefined, error, isError: true, isLoading: false, refetch: retry });

    if (state.kind !== "error") {
      throw new Error("Expected dashboard error state.");
    }

    state.onRetry();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("does not clear authentication for temporary dashboard failures", () => {
    const error = new ApiClientError("Server error", { isNetworkError: false, status: 500 });

    expect(shouldClearDashboardSession(error)).toBe(false);
    expect(useAuthStore.getState().token).toBe("stored-token");
  });

  it("only clears the dashboard session on confirmed unauthorized responses", () => {
    const error = new ApiClientError("Unauthorized", { isNetworkError: false, status: 401 });

    expect(shouldClearDashboardSession(error)).toBe(true);
  });

  it("never renders empty copy or fallback rupee values for failed requests", () => {
    const error = new ApiClientError("Server error", { isNetworkError: false, status: 500 });
    const state = getDashboardScreenState({ data: undefined, error, isError: true, isLoading: false, refetch: retry });

    expect(state.kind).toBe("error");
    expect(JSON.stringify(state)).not.toContain("No data to show");
    expect(JSON.stringify(state)).not.toContain("₹0");
  });
});
