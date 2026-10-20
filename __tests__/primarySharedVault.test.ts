import {
  applySafeToSpendRules,
  primarySharedVaultSafeToSpendBreakdownItems,
  primarySharedVaultSafeToSpendSettlement,
  primarySharedVaultSettlementCardState
} from "@/features/dashboard/primarySharedVaultSettlement";
import { invalidatePrimarySharedVaultDependents } from "@/features/settings/api";
import {
  PRIMARY_SHARED_VAULT_NONE_ID,
  isPrimarySharedVaultNone,
  primarySharedVaultOptions,
  selectedPrimarySharedVaultOption
} from "@/features/settings/primarySharedVaultModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { PrimarySharedVaultApi, SettlementApi, SharedVaultSummaryApi } from "@/services/api/types";

const settlement = (overrides: Partial<SettlementApi> = {}): SettlementApi => ({
  amount: 500,
  direction: "receivable",
  items: [],
  label: "You are owed",
  net: 500,
  payable: 0,
  receivable: 500,
  ...overrides
});

const primaryVault = (id: number, name: string): PrimarySharedVaultApi => ({
  configured: true,
  sharedVault: { id, name }
});

const sharedVaults: SharedVaultSummaryApi[] = [
  { id: 10, isAdmin: true, memberCount: 2, name: "Regular Shared", role: "owner", vaultType: "Shared" },
  { id: 20, isAdmin: false, memberCount: 3, name: "Vacation", role: "member", vaultType: "Shared" }
];

const cashComponents = {
  availableCash: 10000,
  creditCardDue: 1000,
  remainingCommitments: 2000,
  savingsGoal: 1500
};

describe("Primary Shared Vault Feature", () => {
  const originalFetch = globalThis.fetch;
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.money-vault.test";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.resetModules();
  });

  it("1. Primary Shared Vault loads correctly", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ configured: true, sharedVault: { id: 10, name: "Regular Shared" } }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    const result = await apiClient.getPrimarySharedVault("jwt-token");

    expect(result).toEqual({
      configured: true,
      sharedVault: { id: 10, name: "Regular Shared" }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/vaults/personal/primary-shared-vault",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("2. Selecting a vault updates the setting", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ configured: true, shared_vault: { id: 20, name: "Vacation" } }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    const result = await apiClient.setPrimarySharedVault("jwt-token", { sharedVaultId: 20 });

    expect(result).toEqual({
      configured: true,
      sharedVault: { id: 20, name: "Vacation" }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/vaults/personal/primary-shared-vault",
      expect.objectContaining({
        body: JSON.stringify({ sharedVaultId: 20 }),
        method: "PUT"
      })
    );
  });

  it("dropdown lists every shared vault plus None and can clear the selection", () => {
    const options = primarySharedVaultOptions(sharedVaults);

    expect(options.map((option) => option.id)).toEqual([PRIMARY_SHARED_VAULT_NONE_ID, 10, 20]);
    expect(options[0]).toMatchObject({
      description: "Do not show shared settlement totals on the Personal Dashboard.",
      title: "None"
    });
    expect(isPrimarySharedVaultNone(options[0]!.id)).toBe(true);

    const selected = selectedPrimarySharedVaultOption(options, 20);
    expect(selected).toMatchObject({ id: 20, title: "Vacation" });

    const cleared = selectedPrimarySharedVaultOption(options, null);
    expect(cleared.id).toBe(PRIMARY_SHARED_VAULT_NONE_ID);
    expect(cleared.title).toBe("None");
  });

  it("Safe to Spend uses the owed amount from the selected Shared Vault", () => {
    const owed = settlement({ amount: 500, direction: "receivable", label: "You are owed", net: 500, payable: 0, receivable: 500 });
    const settlementItems = primarySharedVaultSafeToSpendSettlement({
      hasPrimaryVault: true,
      settlement: owed
    });
    const breakdownItems = primarySharedVaultSafeToSpendBreakdownItems(settlementItems);
    const total = applySafeToSpendRules({ ...cashComponents, ...settlementItems });

    expect(settlementItems).toEqual({ youAreOwed: 500, youOwe: 0 });
    expect(breakdownItems).toEqual([{ amount: 0, key: "you_owe", label: "You Owe", operation: "subtract" }, { amount: 500, key: "you_are_owed", label: "You Are Owed", operation: "add" }]);
    expect(total).toBe(6000);
    expect(total).not.toBe(applySafeToSpendRules({ ...cashComponents, youAreOwed: 0, youOwe: 0 }));
  });

  it("Safe to Spend subtracts the payable amount from the selected Shared Vault", () => {
    const payable = settlement({ amount: 1200, direction: "payable", label: "You owe", net: -1200, payable: 1200, receivable: 0 });
    const settlementItems = primarySharedVaultSafeToSpendSettlement({
      hasPrimaryVault: true,
      settlement: payable
    });
    const breakdownItems = primarySharedVaultSafeToSpendBreakdownItems(settlementItems);
    const total = applySafeToSpendRules({ ...cashComponents, ...settlementItems });

    expect(settlementItems).toEqual({ youAreOwed: 0, youOwe: 1200 });
    expect(breakdownItems).toEqual([{ amount: 1200, key: "you_owe", label: "You Owe", operation: "subtract" }]);
    expect(total).toBe(4300);
  });

  it("switching Primary Shared Vaults uses each vault's settlement without netting", () => {
    const regular = settlement({ amount: 500, direction: "receivable", label: "You are owed", net: 500, payable: 0, receivable: 500 });
    const vacation = settlement({ amount: 1200, direction: "payable", label: "You owe", net: -1200, payable: 1200, receivable: 0 });

    const regularTotal = applySafeToSpendRules({
      ...cashComponents,
      ...primarySharedVaultSafeToSpendSettlement({ hasPrimaryVault: true, settlement: regular })
    });
    const vacationTotal = applySafeToSpendRules({
      ...cashComponents,
      ...primarySharedVaultSafeToSpendSettlement({ hasPrimaryVault: true, settlement: vacation })
    });

    expect(regularTotal).toBe(6000);
    expect(vacationTotal).toBe(4300);
    expect(regularTotal).not.toBe(vacationTotal);
    expect(regularTotal).not.toBe(applySafeToSpendRules({
      ...cashComponents,
      youAreOwed: regular.receivable,
      youOwe: vacation.payable
    }));
  });

  it("no primary shared vault leaves Safe to Spend settlement at zero", () => {
    const settlementItems = primarySharedVaultSafeToSpendSettlement({
      hasPrimaryVault: false,
      settlement: settlement({ payable: 1200, receivable: 500 })
    });

    expect(settlementItems).toEqual({ youAreOwed: 0, youOwe: 0 });
    expect(applySafeToSpendRules({ ...cashComponents, ...settlementItems })).toBe(5500);
    expect(selectedPrimarySharedVaultOption(primarySharedVaultOptions(sharedVaults), null).title).toBe("None");
  });

  it("3. Clearing the selection works", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ configured: false, sharedVault: null }), {
        status: 200
      })
    );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    const result = await apiClient.clearPrimarySharedVault("jwt-token");

    expect(result).toEqual({
      configured: false,
      sharedVault: null
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.money-vault.test/api/vaults/personal/primary-shared-vault",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("4. Personal Dashboard uses the selected Primary Shared Vault without netting across vaults", () => {
    const regular = settlement({ amount: 500, direction: "receivable", label: "You are owed", net: 500, receivable: 500 });
    const vacation = settlement({ amount: 1200, direction: "payable", label: "You owe", net: -1200, payable: 1200, receivable: 0 });

    // When Regular Shared is primary
    const regularState = primarySharedVaultSettlementCardState({
      isLoading: false,
      primarySharedVault: primaryVault(10, "Regular Shared"),
      settlement: regular
    });

    expect(regularState).toMatchObject({
      amount: 500,
      canSettle: true,
      hasPrimaryVault: true,
      primaryVaultName: "Regular Shared",
      subtitle: "You are owed"
    });
    // Balances must NOT cancel each other (500 - 1200 = -700 must not occur)
    expect(regularState.amount).not.toBe(regular.amount - vacation.amount);

    // When Vacation is primary
    const vacationState = primarySharedVaultSettlementCardState({
      isLoading: false,
      primarySharedVault: primaryVault(20, "Vacation"),
      settlement: vacation
    });

    expect(vacationState).toMatchObject({
      amount: 1200,
      canSettle: true,
      hasPrimaryVault: true,
      primaryVaultName: "Vacation",
      subtitle: "You owe"
    });
  });

  it("5. Changing Primary invalidates/refetches the relevant settlement data", () => {
    const vault10Key = queryKeys.shared.settlements("personal-1", 10);
    const vault20Key = queryKeys.shared.settlements("personal-1", 20);

    expect(vault10Key).toEqual(["shared", "settlements", "personal-1", 10]);
    expect(vault20Key).toEqual(["shared", "settlements", "personal-1", 20]);
    expect(vault10Key).not.toEqual(vault20Key);
    expect(queryKeys.vaults.primaryShared("personal-1")).toEqual(["vaults", "primaryShared", "personal-1"]);
    expect(queryKeys.dashboard.current("personal-1")).toEqual(["dashboard", "current", "personal-1"]);

    const spy = jest.spyOn(queryClient, "invalidateQueries");
    invalidatePrimarySharedVaultDependents("personal-1", 20);

    const invalidated = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidated).toEqual(
      expect.arrayContaining([
        queryKeys.vaults.primaryShared("personal-1"),
        queryKeys.dashboard.root,
        queryKeys.dashboard.current("personal-1"),
        queryKeys.shared.root,
        queryKeys.shared.settlements("personal-1", 20)
      ])
    );

    spy.mockClear();
    invalidatePrimarySharedVaultDependents("personal-1");
    const cleared = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(cleared).toEqual(
      expect.arrayContaining([queryKeys.dashboard.root, queryKeys.dashboard.current("personal-1"), queryKeys.shared.root])
    );
    spy.mockRestore();
  });

  it("6. Empty state displays properly when none selected", () => {
    const state = primarySharedVaultSettlementCardState({
      isLoading: false,
      primarySharedVault: { configured: false, sharedVault: null },
      settlement: null
    });

    expect(state).toEqual({
      amount: null,
      canSettle: false,
      hasPrimaryVault: false,
      primaryVaultName: "",
      subtitle: "No primary shared vault selected"
    });
  });

  it("7. Empty state card is actionable for settings navigation", () => {
    // When no primary vault is configured, hasPrimaryVault must be false.
    // The dashboard uses this to navigate to settings rather than disabling the card.
    const emptyState = primarySharedVaultSettlementCardState({
      isLoading: false,
      primarySharedVault: { configured: false, sharedVault: null },
      settlement: null
    });

    expect(emptyState.hasPrimaryVault).toBe(false);
    expect(emptyState.canSettle).toBe(false);

    // When a primary vault IS configured, hasPrimaryVault must be true.
    const configuredState = primarySharedVaultSettlementCardState({
      isLoading: false,
      primarySharedVault: primaryVault(10, "Regular Shared"),
      settlement: settlement()
    });

    expect(configuredState.hasPrimaryVault).toBe(true);
    expect(configuredState.primaryVaultName).toBe("Regular Shared");
  });
});
