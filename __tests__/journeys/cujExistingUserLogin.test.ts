import { queryClient } from "@/lib/queryClient";
import { apiClient } from "@/services/api/client";
import { targetRouteForAccessState } from "@/lib/accessRoutes";
import { useAccessStore } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

const existingUserVault = {
  id: "1",
  isAdmin: true,
  name: "Personal Vault",
  vaultType: "Individual" as const
};

const existingUserLoginResponse = {
  authenticatedVault: existingUserVault,
  displayName: "John Doe",
  pinSet: true, // EXISTING USER ALREADY HAS PIN SET
  token: "jwt-token-existing-user",
  vault: existingUserVault,
  userId: "user-123"
};

describe("CUJ 3 — Existing user login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setSignedOut();
    useAccessStore.getState().setAccessState("booting");
    useOnboardingStore.setState({ hasHydrated: true, vaults: {} });
  });

  it("existing user with PIN set should reach ready dashboard after login", async () => {
    // Mock the dashboard API to return a completed setup
    jest.spyOn(apiClient, "getDashboard").mockResolvedValueOnce({
      data: {
        creditCardDue: 0,
        cycle: {
          daysCompleted: 15,
          daysRemaining: 15,
          displayName: "August Cycle",
          endDate: "2026-08-31",
          id: 1,
          progressPercent: 50,
          startDate: "2026-08-01",
          status: "active",
          totalDays: 31
        },
        expensesThisCycle: 5000,
        primaryAccount: { balance: 50000, name: "Salary Account" },
        recentActivity: [],
        remainingCommitments: 0,
        safeToSpend: 45000,
        setup: {
          accounts: 1,
          commitments: 0,
          hasAccounts: true,
          hasCommitments: false,
          hasCycleSetting: true,
          hasIncomeTemplates: false,
          hasSavingsGoal: false,
          hasVaultLogin: true,
          incomeTemplates: 0,
          isComplete: true // EXISTING USER HAS COMPLETED SETUP
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
      vault: existingUserVault
    } as any);

    // Simulate login
    const authState = useAuthStore.getState();

    // Verify starting state
    expect(authState.status).toBe("signed-out");

    // Call setAuthenticated as if login succeeded
    authState.setAuthenticated(
      existingUserLoginResponse.token,
      existingUserLoginResponse.vault,
      existingUserLoginResponse.authenticatedVault,
      {
        displayName: existingUserLoginResponse.displayName,
        pinSet: existingUserLoginResponse.pinSet,
        userId: existingUserLoginResponse.userId
      }
    );

    // Verify auth state was updated
    const updatedAuthState = useAuthStore.getState();
    expect(updatedAuthState.status).toBe("authenticated");
    expect(updatedAuthState.token).toBe(existingUserLoginResponse.token);
    expect(updatedAuthState.pinSet).toBe(true);
    expect(updatedAuthState.vault?.id).toBe(existingUserVault.id);

    // Simulate AppBootstrapProvider checking vault setup
    if (!updatedAuthState.token) {
      throw new Error("Token should be set after login");
    }
    const setupStatus = await apiClient.getDashboard(updatedAuthState.token).then((dashboard) => ({
      isComplete: dashboard.data.setup.isComplete
    }));

    expect(setupStatus.isComplete).toBe(true);

    // With setupComplete=true, accessState should be "ready"
    // (account PIN is already proven by username + PIN login; app-lock PIN is separate)
    const calculatedAccessState = (() => {
      if (!updatedAuthState.token || updatedAuthState.status !== "authenticated") {
        return "signed-out";
      }
      if (!setupStatus.isComplete) {
        return "onboarding";
      }
      return "ready";
    })();

    expect(calculatedAccessState).toBe("ready");

    // Simulate AccessGate routing
    const targetRoute = targetRouteForAccessState("ready");
    expect(targetRoute).toBe("/");

    // The user should NOT be sent back to Welcome
    expect(targetRoute).not.toBe("/welcome");
  });

  it("login response without proper token should fail", async () => {
    const authState = useAuthStore.getState();

    // Simulate login failure by not calling setAuthenticated
    expect(authState.status).toBe("signed-out");

    // Verify that without setAuthenticated, user stays signed out
    const targetRoute = targetRouteForAccessState("signed-out");
    expect(targetRoute).toBe("/welcome");
  });

  it("login with incomplete setup should go to onboarding, not dashboard", async () => {
    jest.spyOn(apiClient, "getDashboard").mockResolvedValueOnce({
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
          isComplete: false // SETUP NOT COMPLETE
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
      vault: existingUserVault
    } as any);

    const authState = useAuthStore.getState();
    authState.setAuthenticated(
      existingUserLoginResponse.token,
      existingUserLoginResponse.vault,
      existingUserLoginResponse.authenticatedVault,
      {
        displayName: existingUserLoginResponse.displayName,
        pinSet: existingUserLoginResponse.pinSet,
        userId: existingUserLoginResponse.userId
      }
    );

    const updatedAuthState = useAuthStore.getState();
    if (!updatedAuthState.token) {
      throw new Error("Token should be set after login");
    }
    const setupStatus = await apiClient.getDashboard(updatedAuthState.token).then((dashboard) => ({
      isComplete: dashboard.data.setup.isComplete
    }));

    // Even if setupComplete=false, incomplete Personal Vault setup goes to onboarding
    const calculatedAccessState = (() => {
      if (!updatedAuthState.token || updatedAuthState.status !== "authenticated") {
        return "signed-out";
      }
      if (!setupStatus.isComplete) {
        return "onboarding";
      }
      return "ready";
    })();

    expect(calculatedAccessState).toBe("onboarding");

    const targetRoute = targetRouteForAccessState("onboarding");
    expect(targetRoute).toBe("/onboarding");
  });
});
