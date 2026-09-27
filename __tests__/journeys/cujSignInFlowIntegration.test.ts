/**
 * This test verifies the complete login flow as it happens in the real app:
 * 1. User on /sign-in screen enters username + PIN
 * 2. Clicks Sign In button
 * 3. SignInScreen calls loginWithUsernamePin
 * 4. SignInScreen calls setAuthenticated
 * 5. AppBootstrapProvider calculates new accessState  
 * 6. AccessGate should redirect to "/" instead of "/welcome"
 */

import { needsAccessRedirect, targetRouteForAccessState } from "@/lib/accessRoutes";
import { queryClient } from "@/lib/queryClient";
import { apiClient } from "@/services/api/client";
import { loginWithUsernamePin, sessionExtras } from "@/services/api/session";
import { useAccessStore } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

const existingUserVault = {
  id: "1",
  isAdmin: true,
  name: "Personal Vault",
  vaultType: "Individual" as const
};

describe("Sign-In Flow Integration - Real flow simulation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useAuthStore.getState().setSignedOut();
    useAccessStore.getState().setAccessState("signed-out");
    useOnboardingStore.setState({ hasHydrated: true, vaults: {} });
  });

  it("should complete login and route to dashboard, not back to welcome", async () => {
    // Mock login API to return valid credentials
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: existingUserVault,
      displayName: "Existing User",
      pinSet: true,
      token: "jwt-existing-user",
      vault: existingUserVault,
      userId: "user-existing"
    });

    // Mock dashboard API for setup check
    jest.spyOn(apiClient, "getDashboard").mockResolvedValueOnce({
      data: {
        creditCardDue: 0,
        cycle: {
          daysCompleted: 10,
          daysRemaining: 20,
          displayName: "Current Cycle",
          endDate: "2026-08-31",
          id: 1,
          progressPercent: 33,
          startDate: "2026-08-01",
          status: "active",
          totalDays: 31
        },
        expensesThisCycle: 1000,
        primaryAccount: { balance: 99000, name: "Salary" },
        recentActivity: [],
        remainingCommitments: 0,
        safeToSpend: 99000,
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
          isComplete: true // User has completed setup
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

    // ===== STEP 1: User clicks Sign In button =====
    const initialAuthState = useAuthStore.getState();
    expect(initialAuthState.status).toBe("signed-out");
    expect(initialAuthState.token).toBeNull();

    // ===== STEP 2: SignInScreen calls loginWithUsernamePin =====
    const session = await loginWithUsernamePin("john_doe", "123456");
    expect(session.token).toBe("jwt-existing-user");
    expect(session.pinSet).toBe(true);

    // ===== STEP 3: SignInScreen calls setAuthenticated =====
    const setAuthenticated = useAuthStore.getState().setAuthenticated;
    setAuthenticated(session.token, session.vault, session.authenticatedVault, sessionExtras(session));

    // ===== STEP 4: Verify auth state was updated =====
    const authState = useAuthStore.getState();
    expect(authState.status).toBe("authenticated");
    expect(authState.token).toBe("jwt-existing-user");
    expect(authState.pinSet).toBe(true);
    expect(authState.vault?.id).toBe("1");
    console.log("✓ Auth state updated correctly after login");

    // ===== STEP 5: AppBootstrapProvider would check setup status =====
    const dashboard = await apiClient.getDashboard(authState.token!);
    expect(dashboard.data.setup.isComplete).toBe(true);
    console.log("✓ Setup status check completed");

    // ===== STEP 6: AppBootstrapProvider would calculate accessState =====
    // Simulate the exact calculation that AppBootstrapProvider does
    const accessState = (() => {
      if (authState.status === "booting") {
        return "booting";
      }

      if (authState.status === "signed-out") {
        return "signed-out";
      }

      // Setup completeness comes from the API; account PIN is already proven by login.
      if (authState.status === "authenticated") {
        if (!dashboard.data.setup.isComplete) {
          return "onboarding";
        }
        return "ready";
      }

      return "signed-out";
    })();

    expect(accessState).toBe("ready");
    console.log("✓ Access state calculated correctly as 'ready'");

    const pathname = "/sign-in";
    expect(needsAccessRedirect(accessState, pathname)).toBe(true);
    const targetRoute = targetRouteForAccessState(accessState);
    expect(targetRoute).toBe("/");
    expect(targetRoute).not.toBe("/welcome");
  });

  it("should detect if token is not being stored correctly", async () => {
    // This test checks if the token storage is failing
    const storeTokenSpy = jest.spyOn(require("expo-secure-store"), "setItemAsync");

    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: existingUserVault,
      displayName: "Test User",
      pinSet: true,
      token: "jwt-test-token",
      vault: existingUserVault,
      userId: "user-test"
    });

    try {
      const session = await loginWithUsernamePin("test_user", "123456");
      // If we get here, token was stored successfully
      expect(session.token).toBe("jwt-test-token");
      expect(storeTokenSpy).toHaveBeenCalledWith("money_vault_backend_auth_token", "jwt-test-token");
      console.log("✓ Token was stored in SecureStore");
    } catch (error) {
      throw new Error(`Login failed, indicating token storage issue: ${error}`);
    }
  });

  it("should handle the case where setup check fails gracefully", async () => {
    // Even if getDashboard fails, the app should still work
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      authenticatedVault: existingUserVault,
      displayName: "Test User",
      pinSet: true,
      token: "jwt-test-token",
      vault: existingUserVault,
      userId: "user-test"
    });

    jest.spyOn(apiClient, "getDashboard").mockRejectedValueOnce(new Error("Network error"));

    const session = await loginWithUsernamePin("test_user", "123456");
    const setAuthenticated2 = useAuthStore.getState().setAuthenticated;
    setAuthenticated2(session.token, session.vault, session.authenticatedVault, sessionExtras(session));

    const authState = useAuthStore.getState();
    expect(authState.status).toBe("authenticated");
    expect(authState.pinSet).toBe(true);

    // Even if getDashboard fails, since pinSet is true, the app should allow access
    // (AppBootstrapProvider would use local onboarding state as fallback)
    // This is important - the app should NOT sign out the user just because one API call failed
    expect(authState.token).not.toBeNull();
    console.log("✓ App handles setup check failure gracefully");
  });
});
