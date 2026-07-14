import * as SecureStore from "expo-secure-store";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient, ApiClientError } from "@/services/api/client";
import { clearBackendSession, loginWithVaultCredentials, restoreBackendSession } from "@/services/api/session";

const vault = {
  id: "1",
  isAdmin: true,
  name: "Karuna",
  vaultType: "Individual"
};

describe("backend session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("stores the backend JWT in Secure Store after successful login", async () => {
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "jwt-token",
      vault
    });

    const response = await loginWithVaultCredentials({ pin: "0012", vaultName: "Karuna" });

    expect(response.token).toBe("jwt-token");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("money-vault:backend-auth-token", "jwt-token");
  });

  it("removes stale Dashboard cache when logging into a vault", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("old-vault"), { stale: true });
    jest.spyOn(apiClient, "login").mockResolvedValueOnce({
      token: "jwt-token",
      vault
    });

    await loginWithVaultCredentials({ pin: "0012", vaultName: "Karuna" });

    expect(queryClient.getQueryData(queryKeys.dashboard.current("old-vault"))).toBeUndefined();
  });

  it("does not store a token after failed login", async () => {
    jest.spyOn(apiClient, "login").mockRejectedValueOnce(
      new ApiClientError("Invalid vault credentials.", {
        code: "INVALID_CREDENTIALS",
        isNetworkError: false,
        status: 401
      })
    );

    await expect(loginWithVaultCredentials({ pin: "0012", vaultName: "Karuna" })).rejects.toThrow("Invalid vault credentials.");
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("restores a valid token by validating against dashboard", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getDashboard").mockResolvedValueOnce({
      data: {
        creditCardDue: 0,
        cycle: {
          daysCompleted: 1,
          daysRemaining: 1,
          displayName: "Cycle",
          endDate: "2026-07-31",
          id: 1,
          progressPercent: 50,
          startDate: "2026-07-01",
          status: "active",
          totalDays: 2
        },
        expensesThisCycle: 0,
        primaryAccount: { balance: 0, name: "Account" },
        recentActivity: [],
        remainingCommitments: 0,
        safeToSpend: 0,
        setup: {
          accounts: 1,
          commitments: 0,
          hasAccounts: true,
          hasCommitments: false,
          hasCycleSetting: true,
          hasIncomeTemplates: false,
          hasSavingsGoal: true,
          hasVaultLogin: true,
          incomeTemplates: 0,
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
        spendingByCategory: [],
        summary: {}
      },
      generatedAt: "2026-07-14T00:00:00Z",
      vault
    });

    await expect(restoreBackendSession()).resolves.toEqual({
      token: "jwt-token",
      vault
    });
  });

  it("clears a stored token when dashboard validation returns 401", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getDashboard").mockRejectedValueOnce(
      new ApiClientError("Invalid authentication token.", {
        isNetworkError: false,
        status: 401
      })
    );

    await expect(restoreBackendSession()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("money-vault:backend-auth-token");
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toBeUndefined();
  });

  it("preserves a stored token when restore fails due to network error", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getDashboard").mockRejectedValueOnce(
      new ApiClientError("Network unavailable.", {
        isNetworkError: true,
        status: null
      })
    );

    await expect(restoreBackendSession()).rejects.toThrow("Network unavailable.");
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("preserves a stored token when restore fails with a 5xx response", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("jwt-token");
    jest.spyOn(apiClient, "getDashboard").mockRejectedValueOnce(
      new ApiClientError("Server unavailable.", {
        isNetworkError: false,
        status: 503
      })
    );

    await expect(restoreBackendSession()).rejects.toThrow("Server unavailable.");
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("clears token and Dashboard cache when signing out", async () => {
    queryClient.setQueryData(queryKeys.dashboard.current("1"), { stale: true });

    await clearBackendSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("money-vault:backend-auth-token");
    expect(queryClient.getQueryData(queryKeys.dashboard.current("1"))).toBeUndefined();
  });
});
