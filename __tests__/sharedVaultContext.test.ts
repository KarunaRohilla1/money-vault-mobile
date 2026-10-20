import { resolveSharedVaultId } from "@/features/shared/hooks/useSharedVaultDashboard";
import { queryKeys } from "@/lib/queryKeys";

describe("shared vault context and query isolation", () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.resetModules();
  });

  describe("resolveSharedVaultId", () => {
    it("returns explicit sharedVaultId when explicitly passed", () => {
      expect(
        resolveSharedVaultId(101, {
          id: "1",
          vaultType: "Individual"
        })
      ).toBe(101);

      expect(
        resolveSharedVaultId(102, {
          id: "101",
          vaultType: "Shared"
        })
      ).toBe(102);

      expect(
        resolveSharedVaultId(null, {
          id: "101",
          vaultType: "Shared"
        })
      ).toBeNull();
    });

    it("derives sharedVaultId from active Shared vault when explicit value is undefined", () => {
      expect(
        resolveSharedVaultId(undefined, {
          id: "105",
          vaultType: "Shared"
        })
      ).toBe(105);

      expect(
        resolveSharedVaultId(undefined, {
          id: 105,
          vaultType: "Shared"
        })
      ).toBe(105);
    });

    it("returns null when no explicit id is provided and active vault is Individual", () => {
      expect(
        resolveSharedVaultId(undefined, {
          id: "1",
          vaultType: "Individual"
        })
      ).toBeNull();

      expect(resolveSharedVaultId(undefined, null)).toBeNull();
    });
  });

  describe("query keys isolation", () => {
    it("generates distinct cache keys for different shared vaults within the same session", () => {
      const dashboardVaultA = queryKeys.shared.dashboard("vault_1", 101);
      const dashboardVaultB = queryKeys.shared.dashboard("vault_1", 102);
      expect(dashboardVaultA).not.toEqual(dashboardVaultB);
      expect(dashboardVaultA).toEqual(["shared", "dashboard", "vault_1", 101]);
      expect(dashboardVaultB).toEqual(["shared", "dashboard", "vault_1", 102]);

      const expensesVaultA = queryKeys.shared.expenses("vault_1", 101);
      const expensesVaultB = queryKeys.shared.expenses("vault_1", 102);
      expect(expensesVaultA).not.toEqual(expensesVaultB);
      expect(expensesVaultA).toEqual(["shared", "expenses", "vault_1", 101]);
      expect(expensesVaultB).toEqual(["shared", "expenses", "vault_1", 102]);

      const billsVaultA = queryKeys.shared.bills("vault_1", 101);
      const billsVaultB = queryKeys.shared.bills("vault_1", 102);
      expect(billsVaultA).not.toEqual(billsVaultB);
      expect(billsVaultA).toEqual(["shared", "bills", "vault_1", 101]);
      expect(billsVaultB).toEqual(["shared", "bills", "vault_1", 102]);
    });
  });

  describe("apiClient sharedVaultId query parameter passing", () => {
    it("forwards sharedVaultId to dashboard, expenses, bills, and settlements endpoints", async () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
      const fetchMock = jest.fn(async () =>
        new Response(
          JSON.stringify({
            data: {},
            expenses: [],
            bills: [],
            items: []
          }),
          { status: 200 }
        )
      );
      globalThis.fetch = fetchMock;

      const { apiClient } = await import("@/services/api/client");

      await apiClient.getSharedDashboard("jwt-token", 101);
      await apiClient.getSharedExpenses("jwt-token", 101);
      await apiClient.getSharedBills("jwt-token", 101);
      await apiClient.getSharedSettlements("jwt-token", 101);

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "https://api.money-vault.test/api/shared/dashboard?sharedVaultId=101",
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "https://api.money-vault.test/api/shared/expenses?sharedVaultId=101",
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "https://api.money-vault.test/api/shared/bills?sharedVaultId=101",
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        4,
        "https://api.money-vault.test/api/shared/settlements?sharedVaultId=101",
        expect.any(Object)
      );
    });
  });
});
