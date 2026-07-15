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
    expect(queryKeys.transactions.list("vault_1", "filters")).not.toEqual(queryKeys.transactions.list("vault_2", "filters"));
    expect(queryKeys.transfers.byVault("vault_1")).not.toEqual(queryKeys.transfers.byVault("vault_2"));
    expect(queryKeys.wishlist.current("vault_1")).not.toEqual(queryKeys.wishlist.current("vault_2"));
  });
});
