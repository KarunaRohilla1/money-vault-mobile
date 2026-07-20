import { queryKeys } from "@/lib/queryKeys";

describe("queryKeys", () => {
  it("keeps local settings defaults separate from vault-specific settings", () => {
    expect(queryKeys.settings.effective(null)).toEqual(["settings", "effective", "local-defaults"]);
    expect(queryKeys.settings.effective("vault_123")).toEqual(["settings", "effective", "vault_123"]);
  });

  it("defines a stable dashboard API query key", () => {
    expect(queryKeys.dashboard.root).toEqual(["dashboard"]);
    expect(queryKeys.dashboard.current("vault_1")).toEqual(["dashboard", "current", "vault_1"]);
  });

  it("scopes dashboard API query keys by vault", () => {
    expect(queryKeys.dashboard.current("vault_1")).not.toEqual(queryKeys.dashboard.current("vault_2"));
  });

  it("scopes business feature query keys by vault", () => {
    expect(queryKeys.accounts.byVault("vault_1")).not.toEqual(queryKeys.accounts.byVault("vault_2"));
    expect(queryKeys.categories.byVault("vault_1")).not.toEqual(queryKeys.categories.byVault("vault_2"));
    expect(queryKeys.planning.current("vault_1")).not.toEqual(queryKeys.planning.current("vault_2"));
    expect(queryKeys.reports.current("vault_1")).not.toEqual(queryKeys.reports.current("vault_2"));
    expect(queryKeys.shared.bills("vault_1")).not.toEqual(queryKeys.shared.bills("vault_2"));
    expect(queryKeys.shared.dashboard("vault_1")).not.toEqual(queryKeys.shared.dashboard("vault_2"));
    expect(queryKeys.shared.dashboard("vault_1", 10)).not.toEqual(queryKeys.shared.dashboard("vault_1", 20));
    expect(queryKeys.shared.expenses("vault_1")).not.toEqual(queryKeys.shared.expenses("vault_2"));
    expect(queryKeys.shared.bills("vault_1", 10)).not.toEqual(queryKeys.shared.bills("vault_1", 20));
    expect(queryKeys.transactions.detail("vault_1", 12)).not.toEqual(queryKeys.transactions.detail("vault_2", 12));
    expect(queryKeys.transactions.list("vault_1", "filters")).not.toEqual(queryKeys.transactions.list("vault_2", "filters"));
    expect(queryKeys.transfers.byVault("vault_1")).not.toEqual(queryKeys.transfers.byVault("vault_2"));
    expect(queryKeys.transfers.lists("vault_1")).not.toEqual(queryKeys.transfers.lists("vault_2"));
    expect(queryKeys.transfers.list("vault_1", "filters")).not.toEqual(queryKeys.transfers.list("vault_2", "filters"));
    expect(queryKeys.transfers.list("vault_1", "filters-a")).not.toEqual(queryKeys.transfers.list("vault_1", "filters-b"));
    expect(queryKeys.transfers.detail("vault_1", "group-a")).not.toEqual(queryKeys.transfers.detail("vault_2", "group-a"));
    expect(queryKeys.wishlist.current("vault_1")).not.toEqual(queryKeys.wishlist.current("vault_2"));
  });

  it("uses one prefix hierarchy for transfer cache invalidation", () => {
    expect(queryKeys.transfers.all).toEqual(["transfers"]);
    expect(queryKeys.transfers.byVault("vault_1")).toEqual(["transfers", "vault_1"]);
    expect(queryKeys.transfers.lists("vault_1")).toEqual(["transfers", "vault_1", "list"]);
    expect(queryKeys.transfers.list("vault_1", "filters")).toEqual(["transfers", "vault_1", "list", "filters"]);
    expect(queryKeys.transfers.detail("vault_1", "group_1")).toEqual(["transfers", "vault_1", "detail", "group_1"]);
  });
});
