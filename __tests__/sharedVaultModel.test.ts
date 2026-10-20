import {
  canManageSharedVaultAsOwner,
  sharedVaultListStatusBadges,
  sharedVaultMemberCountLabel,
  sharedVaultRoleLabel,
  sharedVaultsForSwitch
} from "@/features/settings/sharedVaultModel";

describe("sharedVaultModel", () => {
  it("formats member counts", () => {
    expect(sharedVaultMemberCountLabel(0)).toBe("0 members");
    expect(sharedVaultMemberCountLabel(1)).toBe("1 member");
    expect(sharedVaultMemberCountLabel(4)).toBe("4 members");
  });

  it("maps roles for display and owner permissions", () => {
    expect(sharedVaultRoleLabel("owner")).toBe("Owner");
    expect(sharedVaultRoleLabel("member")).toBe("Member");
    expect(canManageSharedVaultAsOwner("owner")).toBe(true);
    expect(canManageSharedVaultAsOwner("member")).toBe(false);
  });

  it("shows only relevant Shared Vault status badges", () => {
    expect(
      sharedVaultListStatusBadges({
        includeInSafeToSpend: true,
        isPrimary: false,
        showOnDashboard: false
      }).map((badge) => badge.label)
    ).toEqual([]);
    expect(
      sharedVaultListStatusBadges({
        includeInSafeToSpend: false,
        isPrimary: true,
        showOnDashboard: true
      }).map((badge) => badge.label)
    ).toEqual(["Safe to Spend Excluded"]);
    expect(
      sharedVaultListStatusBadges({
        includeInSafeToSpend: true,
        isPrimary: false,
        showOnDashboard: true
      }).map((badge) => badge.key)
    ).toEqual([]);
  });

  it("sorts shared vaults for switch selection", () => {
    expect(
      sharedVaultsForSwitch([
        { id: 2, isAdmin: false, memberCount: 3, name: "Trip Fund", role: "member", vaultType: "Shared" },
        { id: 1, isAdmin: true, memberCount: 2, name: "Our Money", role: "owner", vaultType: "Shared" }
      ]).map((vault) => vault.name)
    ).toEqual(["Our Money", "Trip Fund"]);
  });

  it("filters out the active vault when specified", () => {
    const vaults = [
      { id: 1, isAdmin: true, memberCount: 2, name: "Household", role: "owner", vaultType: "Shared" },
      { id: 2, isAdmin: false, memberCount: 3, name: "Trip Fund", role: "member", vaultType: "Shared" },
      { id: 3, isAdmin: false, memberCount: 4, name: "Project", role: "member", vaultType: "Shared" }
    ];
    expect(sharedVaultsForSwitch(vaults, 1).map((v) => v.id)).toEqual([3, 2]);
    expect(sharedVaultsForSwitch(vaults, "2").map((v) => v.id)).toEqual([1, 3]);
  });
});
