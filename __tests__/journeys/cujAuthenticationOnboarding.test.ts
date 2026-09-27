import * as SecureStore from "expo-secure-store";

import { accountFormError } from "@/features/accounts/accountModel";
import { adaptDashboardResponse } from "@/features/dashboard/adapter";
import { getDashboardScreenState, isEmptyDashboardData } from "@/features/dashboard/state";
import { targetRouteForAccessState } from "@/lib/accessRoutes";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import {
  generateFirstFinancialCycle,
  markOnboardingComplete,
  saveFirstAccount,
  saveMonthlySavingsGoal,
  saveVaultName
} from "@/services/api/onboarding";
import { establishApiSession } from "@/services/api/session";
import type { DashboardApiResponse } from "@/services/api/types";
import { useAccessStore } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { EMPTY_ONBOARDING_DRAFT, useOnboardingStore } from "@/stores/onboardingStore";

const vault = {
  id: "1",
  isAdmin: true,
  name: "Personal Vault",
  vaultType: "Individual" as const
};

const emptyDashboard: DashboardApiResponse = {
  data: {
    creditCardDue: 0,
    cycle: {
      daysCompleted: 0,
      daysRemaining: 30,
      displayName: "August Cycle",
      endDate: "2026-08-31",
      id: 1,
      progressPercent: 0,
      startDate: "2026-08-01",
      status: "active",
      totalDays: 31
    },
    expensesThisCycle: 0,
    primaryAccount: { balance: 0, name: "Unnamed" },
    recentActivity: [],
    remainingCommitments: 0,
    safeToSpend: 0,
    setup: {
      accounts: 0,
      commitments: 0,
      hasAccounts: false,
      hasCommitments: false,
      hasCycleSetting: false,
      hasIncomeTemplates: false,
      hasSavingsGoal: false,
      hasVaultLogin: true,
      incomeTemplates: 0,
      isComplete: false
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
    spendingByCategory: [],
    summary: {}
  },
  generatedAt: "2026-08-09T00:00:00Z",
  vault
};

describe("CUJ 1 — New user authentication and first setup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setSignedOut();
    useAccessStore.getState().setAccessState("booting");
    useOnboardingStore.setState({ hasHydrated: true, vaults: {} });
  });

  it("logs in, routes through onboarding, provisions first account, then reaches a ready dashboard", async () => {
    jest.spyOn(apiClient, "getSession").mockResolvedValueOnce({
      accessibleVaults: [vault],
      authenticatedVault: vault,
      pinSet: false,
      vault
    });
    jest.spyOn(apiClient, "updateSettings").mockResolvedValue({
      accessibleVaults: [],
      currentVault: {
        id: 1,
        isAdmin: true,
        name: "Personal Vault",
        vaultType: "Individual"
      },
      cycleStartDay: 1,
      locale: "en-IN",
      monthlySavingsGoal: 5000
    } as never);
    jest.spyOn(apiClient, "getAccounts").mockResolvedValue([]);
    jest.spyOn(apiClient, "createAccount").mockResolvedValue({
      balance: 25000,
      id: 11,
      isPrimary: true,
      name: "Salary",
      openingBalance: 25000,
      type: "Salary Account"
    } as never);

    const session = await establishApiSession("jwt-new-user");
    useAuthStore.getState().setAuthenticated(session.token, session.vault, session.vault);
    useAccessStore.getState().setAccessState("onboarding");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money_vault_backend_auth_token", "jwt-new-user");
    expect(targetRouteForAccessState(useAccessStore.getState().accessState)).toBe("/onboarding");

    const beforeSetup = adaptDashboardResponse(emptyDashboard);
    expect(isEmptyDashboardData(beforeSetup)).toBe(true);
    expect(getDashboardScreenState({ data: beforeSetup, error: null, isError: false, isLoading: false, refetch: jest.fn() }).kind).toBe(
      "empty"
    );
    expect(accountFormError({ name: "Salary", openingBalance: "25000", type: "Salary Account" })).toBeNull();

    const draft = {
      ...EMPTY_ONBOARDING_DRAFT,
      accountKind: "Salary Account" as const,
      accountName: "Salary",
      cycleStartDay: 1,
      monthlySavingsGoal: "5000",
      openingBalance: "25000",
      vaultName: "Personal Vault"
    };

    await saveVaultName("jwt-new-user", "1", draft.vaultName);
    await saveFirstAccount("jwt-new-user", "1", draft);
    await generateFirstFinancialCycle("jwt-new-user", "1", 1);
    await saveMonthlySavingsGoal("jwt-new-user", "1", draft.monthlySavingsGoal);
    await markOnboardingComplete("jwt-new-user", "1");
    useOnboardingStore.getState().completeVault("1");
    useAccessStore.getState().setAccessState("ready");

    expect(targetRouteForAccessState("ready")).toBe("/");
    expect(apiClient.createAccount).toHaveBeenCalledWith("jwt-new-user", {
      isPrimary: true,
      name: "Salary",
      openingBalance: 25000,
      type: "Salary Account"
    });

    const afterIncome: DashboardApiResponse = {
      ...emptyDashboard,
      data: {
        ...emptyDashboard.data,
        primaryAccount: { balance: 50000, name: "Salary" },
        recentActivity: [
          {
            amount: 25000,
            categoryName: "Salary",
            date: "2026-08-01",
            id: 101,
            notes: "August salary",
            transactionType: "Income"
          }
        ],
        remainingCommitments: 0,
        safeToSpend: 45000,
        setup: {
          ...emptyDashboard.data.setup,
          accounts: 1,
          hasAccounts: true,
          hasCycleSetting: true,
          hasIncomeTemplates: true,
          hasSavingsGoal: true,
          incomeTemplates: 1,
          isComplete: true
        }
      }
    };

    const dashboard = adaptDashboardResponse(afterIncome);
    queryClient.setQueryData(queryKeys.dashboard.current("1"), dashboard);

    expect(isEmptyDashboardData(dashboard)).toBe(false);
    expect(dashboard.safeToSpend).toBe(45000);
    expect(dashboard.recentActivity[0]).toMatchObject({
      amount: 25000,
      categoryName: "Salary",
      transactionType: "Income"
    });
    expect(
      getDashboardScreenState({
        data: queryClient.getQueryData(queryKeys.dashboard.current("1")),
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn()
      }).kind
    ).toBe("success");
  });
});
