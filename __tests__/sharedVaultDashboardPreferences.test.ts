import { applySafeToSpendRules, primarySharedVaultSafeToSpendSettlement } from "@/features/dashboard/primarySharedVaultSettlement";
import {
  sharedVaultBalanceCardCanSettle,
  sharedVaultBalanceCardRoute,
  sharedVaultBalanceCarouselState,
  visibleSharedVaultBalanceCards
} from "@/features/dashboard/sharedVaultBalanceCarousel";
import {
  beginSharedVaultDashboardVisibility,
  beginSharedVaultSafeToSpendInclusion,
  confirmSharedVaultDashboardVisibility,
  confirmSharedVaultSafeToSpendInclusion,
  invalidatePrimarySharedVaultDependents,
  isSharedVaultDashboardTogglePending,
  isSharedVaultSafeToSpendTogglePending,
  rollbackSharedVaultDashboardVisibility,
  rollbackSharedVaultSafeToSpendInclusion
} from "@/features/settings/api";
import type { DashboardViewModel } from "@/features/dashboard/types";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { SharedVaultBalanceCardApi, SharedVaultSummaryApi } from "@/services/api/types";

const cash = {
  availableCash: 10000,
  creditCardDue: 0,
  remainingCommitments: 0,
  savingsGoal: 0
};

const regular: SharedVaultBalanceCardApi = {
  amount: 50,
  direction: "payable",
  id: 10,
  label: "You Owe:",
  name: "Regular Shared",
  payable: 50,
  receivable: 0
};

const vacation: SharedVaultBalanceCardApi = {
  amount: 100,
  direction: "receivable",
  id: 20,
  label: "Owed to You:",
  name: "Vacation",
  payable: 0,
  receivable: 100
};

describe("shared vault dashboard preferences", () => {
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

  it("persists Safe to Spend inclusion and dashboard visibility independently", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 20, includeInSafeToSpend: false, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", showOnDashboard: true, vaultType: "Shared" }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 20, includeInSafeToSpend: false, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", showOnDashboard: false, vaultType: "Shared" }), {
          status: 200
        })
      );
    globalThis.fetch = fetchMock;

    const { apiClient } = await import("@/services/api/client");
    const inclusion = await apiClient.setSharedVaultSafeToSpendInclusion("jwt-token", 20, { includeInSafeToSpend: false });
    expect(inclusion.includeInSafeToSpend).toBe(false);
    expect(inclusion.showOnDashboard).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.money-vault.test/api/vaults/personal/shared-vaults/20/safe-to-spend");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ includeInSafeToSpend: false });

    const visibility = await apiClient.setSharedVaultDashboardVisibility("jwt-token", 20, { showOnDashboard: false });
    expect(visibility.showOnDashboard).toBe(false);
    expect(visibility.includeInSafeToSpend).toBe(false);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.money-vault.test/api/vaults/personal/shared-vaults/20/dashboard");
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({ showOnDashboard: false });
  });

  it("includes and excludes vaults independently without netting", () => {
    const includedBoth = applySafeToSpendRules({
      ...cash,
      youAreOwed: regular.receivable + vacation.receivable,
      youOwe: regular.payable + vacation.payable
    });
    const excludedVacation = applySafeToSpendRules({
      ...cash,
      ...primarySharedVaultSafeToSpendSettlement({ hasPrimaryVault: true, settlement: regular })
    });
    const excludedAll = applySafeToSpendRules({
      ...cash,
      ...primarySharedVaultSafeToSpendSettlement({ hasPrimaryVault: false, settlement: vacation })
    });

    expect(includedBoth).toBe(10050);
    expect(excludedVacation).toBe(9950);
    expect(excludedAll).toBe(10000);
    expect(includedBoth).not.toBe(applySafeToSpendRules({ ...cash, youAreOwed: 0, youOwe: 50 }));
  });

  it("keeps carousel cards independent and navigates to the selected vault", () => {
    const visible = visibleSharedVaultBalanceCards([regular, vacation]);
    expect(visible.map((card) => card.id)).toEqual([10, 20]);
    expect(visible[0]?.amount).toBe(50);
    expect(visible[1]?.amount).toBe(100);
    expect(visible.map((card) => card.amount)).not.toEqual([Math.abs(regular.payable - vacation.receivable)]);
    expect(sharedVaultBalanceCardRoute(vacation)).toEqual({ params: { sharedVaultId: "20" }, pathname: "/shared" });
    expect(sharedVaultBalanceCardCanSettle(regular)).toBe(true);
    expect(sharedVaultBalanceCarouselState({ cards: visible }).kind).toBe("ready");
  });

  it("hides only the selected vault card without changing Safe to Spend inputs", () => {
    expect(visibleSharedVaultBalanceCards([{ ...vacation, showOnDashboard: false }, regular]).map((card) => card.id)).toEqual([10]);
    expect(visibleSharedVaultBalanceCards([{ ...vacation, showOnDashboard: true }, regular]).map((card) => card.id)).toEqual([20, 10]);
    expect(sharedVaultBalanceCarouselState({ cards: [{ ...regular, showOnDashboard: false }, { ...vacation, showOnDashboard: false }] }).kind).toBe("hidden");
    expect(sharedVaultBalanceCarouselState({ cards: [] }).kind).toBe("empty");
    expect(
      applySafeToSpendRules({
        ...cash,
        youAreOwed: vacation.receivable,
        youOwe: regular.payable
      })
    ).toBe(10050);
  });

  it("updates Safe to Spend inclusion immediately and only disables that vault", async () => {
    const vaults: SharedVaultSummaryApi[] = [
      { id: 10, includeInSafeToSpend: true, isAdmin: true, memberCount: 2, name: "Regular Shared", role: "owner", vaultType: "Shared" },
      { id: 20, includeInSafeToSpend: true, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", vaultType: "Shared" }
    ];
    queryClient.setQueryData(queryKeys.vaults.shared, vaults);
    const pendingVaultIds = [20];

    await beginSharedVaultSafeToSpendInclusion({ includeInSafeToSpend: false, sharedVaultId: 20 });

    const optimistic = queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared);
    expect(optimistic?.find((vault) => vault.id === 20)?.includeInSafeToSpend).toBe(false);
    expect(optimistic?.find((vault) => vault.id === 10)?.includeInSafeToSpend).toBe(true);
    expect(isSharedVaultSafeToSpendTogglePending(pendingVaultIds, 20)).toBe(true);
    expect(isSharedVaultSafeToSpendTogglePending(pendingVaultIds, 10)).toBe(false);
  });

  it("ignores a duplicate tap while that vault's save is pending", async () => {
    const vaults: SharedVaultSummaryApi[] = [
      { id: 20, includeInSafeToSpend: true, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", vaultType: "Shared" }
    ];
    queryClient.setQueryData(queryKeys.vaults.shared, vaults);
    await beginSharedVaultSafeToSpendInclusion({ includeInSafeToSpend: false, sharedVaultId: 20 });
    const pendingVaultIds = [20];

    if (!isSharedVaultSafeToSpendTogglePending(pendingVaultIds, 20)) {
      await beginSharedVaultSafeToSpendInclusion({ includeInSafeToSpend: true, sharedVaultId: 20 });
    }

    expect(queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared)?.[0]?.includeInSafeToSpend).toBe(false);
  });

  it("reconciles confirmed inclusion and rolls back only the failed vault", async () => {
    const vaults: SharedVaultSummaryApi[] = [
      { id: 10, includeInSafeToSpend: true, isAdmin: true, memberCount: 2, name: "Regular Shared", role: "owner", vaultType: "Shared" },
      { id: 20, includeInSafeToSpend: true, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", vaultType: "Shared" }
    ];
    queryClient.setQueryData(queryKeys.vaults.shared, vaults);
    const variables = { includeInSafeToSpend: false, sharedVaultId: 20 };

    const snapshot = await beginSharedVaultSafeToSpendInclusion(variables);
    rollbackSharedVaultSafeToSpendInclusion(variables, snapshot.previousIncluded);

    const restored = queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared);
    expect(restored?.find((vault) => vault.id === 20)?.includeInSafeToSpend).toBe(true);
    expect(restored?.find((vault) => vault.id === 10)?.includeInSafeToSpend).toBe(true);

    await beginSharedVaultSafeToSpendInclusion(variables);
    const spy = jest.spyOn(queryClient, "invalidateQueries");
    confirmSharedVaultSafeToSpendInclusion(
      "personal-1",
      { id: 20, includeInSafeToSpend: false, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", vaultType: "Shared" },
      variables
    );
    const confirmed = queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared);
    expect(confirmed?.find((vault) => vault.id === 20)?.includeInSafeToSpend).toBe(false);
    expect(spy.mock.calls.map((call) => call[0]?.queryKey)).toEqual(
      expect.arrayContaining([queryKeys.vaults.shared, queryKeys.dashboard.root, queryKeys.dashboard.current("personal-1")])
    );
    spy.mockRestore();
  });

  it("hides and restores one dashboard card without touching Safe to Spend inclusion", async () => {
    const vaults: SharedVaultSummaryApi[] = [
      { id: 10, includeInSafeToSpend: true, isAdmin: true, memberCount: 2, name: "Regular Shared", role: "owner", showOnDashboard: true, vaultType: "Shared" },
      { id: 20, includeInSafeToSpend: false, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", showOnDashboard: true, vaultType: "Shared" }
    ];
    queryClient.setQueryData(queryKeys.vaults.shared, vaults);
    queryClient.setQueryData(queryKeys.dashboard.current("personal-1"), {
      safeToSpend: 49950,
      sharedVaultBalances: [regular, { ...vacation, showOnDashboard: true }]
    } as DashboardViewModel);

    const variables = { sharedVaultId: 20, showOnDashboard: false };
    await beginSharedVaultDashboardVisibility("personal-1", variables);
    expect(isSharedVaultDashboardTogglePending([20], 20)).toBe(true);
    expect(isSharedVaultDashboardTogglePending([20], 10)).toBe(false);

    const hiddenVaults = queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared);
    const hiddenDashboard = queryClient.getQueryData<DashboardViewModel>(queryKeys.dashboard.current("personal-1"));
    expect(hiddenVaults?.find((vault) => vault.id === 20)?.showOnDashboard).toBe(false);
    expect(hiddenVaults?.find((vault) => vault.id === 10)?.showOnDashboard).toBe(true);
    expect(hiddenVaults?.find((vault) => vault.id === 20)?.includeInSafeToSpend).toBe(false);
    expect(visibleSharedVaultBalanceCards(hiddenDashboard?.sharedVaultBalances).map((card) => card.id)).toEqual([10]);
    expect(hiddenDashboard?.safeToSpend).toBe(49950);

    confirmSharedVaultDashboardVisibility(
      "personal-1",
      { id: 20, includeInSafeToSpend: false, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", showOnDashboard: true, vaultType: "Shared" },
      { sharedVaultId: 20, showOnDashboard: true }
    );
    const restored = queryClient.getQueryData<DashboardViewModel>(queryKeys.dashboard.current("personal-1"));
    expect(visibleSharedVaultBalanceCards(restored?.sharedVaultBalances).map((card) => card.id)).toEqual([10, 20]);
  });

  it("rolls back dashboard visibility when the save fails", async () => {
    const vaults: SharedVaultSummaryApi[] = [
      { id: 20, includeInSafeToSpend: true, isAdmin: false, memberCount: 2, name: "Vacation", role: "member", showOnDashboard: true, vaultType: "Shared" }
    ];
    queryClient.setQueryData(queryKeys.vaults.shared, vaults);
    const variables = { sharedVaultId: 20, showOnDashboard: false };
    const snapshot = await beginSharedVaultDashboardVisibility("personal-1", variables);
    rollbackSharedVaultDashboardVisibility("personal-1", variables, snapshot.previousVisible);
    expect(queryClient.getQueryData<SharedVaultSummaryApi[]>(queryKeys.vaults.shared)?.[0]?.showOnDashboard).toBe(true);
  });

  it("invalidates dashboard and shared vault caches after preference changes", () => {
    const spy = jest.spyOn(queryClient, "invalidateQueries");
    invalidatePrimarySharedVaultDependents("personal-1", 20);
    const keys = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([queryKeys.dashboard.root, queryKeys.dashboard.current("personal-1"), queryKeys.shared.root, queryKeys.vaults.primaryShared("personal-1")])
    );
    spy.mockRestore();
  });

  // --- Zero-balance carousel filtering ---

  it("hides a card with zero outstanding balance even when showOnDashboard is true", () => {
    const zeroBalance: SharedVaultBalanceCardApi = {
      amount: 0,
      direction: "settled",
      id: 30,
      label: "Settled",
      name: "Settled Vault",
      payable: 0,
      receivable: 0,
      showOnDashboard: true
    };
    expect(visibleSharedVaultBalanceCards([zeroBalance]).map((c) => c.id)).toEqual([]);
    expect(sharedVaultBalanceCarouselState({ cards: [zeroBalance] }).kind).toBe("hidden");
  });

  it("hides a card whose direction is 'settled' but amount is still non-zero (server rounding edge)", () => {
    const settled: SharedVaultBalanceCardApi = {
      amount: 0.001,
      direction: "settled",
      id: 31,
      label: "Settled",
      name: "Edge Vault",
      payable: 0,
      receivable: 0,
      showOnDashboard: true
    };
    // hasOutstandingSettlement requires direction !== "settled"
    expect(visibleSharedVaultBalanceCards([settled]).map((c) => c.id)).toEqual([]);
  });

  it("shows a positive payable card (You owe) and preserves its direction", () => {
    const payable: SharedVaultBalanceCardApi = {
      amount: 75,
      direction: "payable",
      id: 40,
      label: "You Owe:",
      name: "Payable Vault",
      payable: 75,
      receivable: 0,
      showOnDashboard: true
    };
    const visible = visibleSharedVaultBalanceCards([payable]);
    expect(visible.map((c) => c.id)).toEqual([40]);
    expect(visible[0]?.direction).toBe("payable");
    expect(sharedVaultBalanceCardCanSettle(payable)).toBe(true);
  });

  it("shows a positive receivable card (You are owed) and preserves its direction", () => {
    const receivable: SharedVaultBalanceCardApi = {
      amount: 200,
      direction: "receivable",
      id: 41,
      label: "Owed to You:",
      name: "Receivable Vault",
      payable: 0,
      receivable: 200,
      showOnDashboard: true
    };
    const visible = visibleSharedVaultBalanceCards([receivable]);
    expect(visible.map((c) => c.id)).toEqual([41]);
    expect(visible[0]?.direction).toBe("receivable");
    // canSettle checks outstanding — receivable is also outstanding
    expect(sharedVaultBalanceCardCanSettle(receivable)).toBe(true);
  });

  it("does not net balances across vaults — shows both payable and receivable independently", () => {
    const payable: SharedVaultBalanceCardApi = { amount: 50, direction: "payable", id: 50, label: "You Owe:", name: "A", payable: 50, receivable: 0, showOnDashboard: true };
    const receivable: SharedVaultBalanceCardApi = { amount: 50, direction: "receivable", id: 51, label: "Owed to You:", name: "B", payable: 0, receivable: 50, showOnDashboard: true };
    const visible = visibleSharedVaultBalanceCards([payable, receivable]);
    expect(visible.map((c) => c.id)).toEqual([50, 51]);
    expect(visible[0]?.direction).toBe("payable");
    expect(visible[1]?.direction).toBe("receivable");
  });

  it("hides a card immediately when it transitions to zero after settlement, carousel becomes hidden not empty", () => {
    const outstanding: SharedVaultBalanceCardApi = { amount: 100, direction: "payable", id: 60, label: "You Owe:", name: "Vault X", payable: 100, receivable: 0, showOnDashboard: true };
    const settled: SharedVaultBalanceCardApi = { ...outstanding, amount: 0, direction: "settled", payable: 0 };

    expect(visibleSharedVaultBalanceCards([outstanding]).map((c) => c.id)).toEqual([60]);
    expect(visibleSharedVaultBalanceCards([settled]).map((c) => c.id)).toEqual([]);

    // When one vault is hidden by zero balance, state is "hidden" (cards exist but none visible)
    expect(sharedVaultBalanceCarouselState({ cards: [outstanding] }).kind).toBe("ready");
    expect(sharedVaultBalanceCarouselState({ cards: [settled] }).kind).toBe("hidden");
  });

  it("hides a card when showOnDashboard is OFF, even when balance is outstanding", () => {
    const hiddenOutstanding: SharedVaultBalanceCardApi = {
      amount: 300,
      direction: "payable",
      id: 70,
      label: "You Owe:",
      name: "Hidden Vault",
      payable: 300,
      receivable: 0,
      showOnDashboard: false
    };
    expect(visibleSharedVaultBalanceCards([hiddenOutstanding]).map((c) => c.id)).toEqual([]);
    expect(sharedVaultBalanceCarouselState({ cards: [hiddenOutstanding] }).kind).toBe("hidden");
  });

  it("does not treat undefined cards (loading) as zero — isLoading short-circuits to loading state", () => {
    expect(sharedVaultBalanceCarouselState({ cards: undefined, isLoading: true }).kind).toBe("loading");
    expect(sharedVaultBalanceCarouselState({ cards: undefined, isError: true }).kind).toBe("error");
    // undefined cards with neither flag falls through to empty (no cards at all)
    expect(sharedVaultBalanceCarouselState({ cards: undefined }).kind).toBe("empty");
  });
});
