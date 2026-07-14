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
});
