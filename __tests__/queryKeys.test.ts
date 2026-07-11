import { queryKeys } from "@/lib/queryKeys";

describe("queryKeys", () => {
  it("keeps local settings defaults separate from vault-specific settings", () => {
    expect(queryKeys.settings.effective(null)).toEqual(["settings", "effective", "local-defaults"]);
    expect(queryKeys.settings.effective("vault_123")).toEqual(["settings", "effective", "vault_123"]);
  });
});
