import {
  filterMoreMenuSections,
  moneyRows,
  moneyRowsForVault,
  moreMenuSectionsForVault,
  preferenceRows,
  preferenceRowsForVault,
  roleLabel,
  settingsPlaceholderTitle,
  switchTarget
} from "@/features/settings/moreModel";

const personalVault = {
  id: 4,
  isAdmin: true,
  name: "Personal Vault",
  vaultType: "Individual"
};

const sharedVault = {
  id: 12,
  isAdmin: false,
  name: "Shared Vault",
  vaultType: "Shared"
};

describe("More screen model", () => {
  it("renders Money rows without the old Shared row", () => {
    expect(moneyRows.map((row) => row.title)).toEqual(["Transactions", "Transfers", "Categories", "Reports", "Wishlist"]);
    expect(moneyRows.some((row) => row.title === "Shared")).toBe(false);
  });

  it("maps Money rows to existing routes", () => {
    expect(moneyRows.map((row) => row.route)).toEqual(["/transactions", "/transfers", "/categories", "/reports", "/wishlist"]);
  });

  it("maps preference rows to settings placeholders", () => {
    expect(preferenceRows.map((row) => row.title)).toEqual(["Vault & Preferences", "Shared Vault", "Security & PIN", "Vault Members"]);
    expect(preferenceRows.map((row) => row.route)).toEqual(["/settings/vault-preferences", "/settings/shared-vault", "/settings/security", "/settings/members"]);
  });

  it("shows Vault Members only for shared vaults and excludes personal preferences", () => {
    expect(preferenceRowsForVault(personalVault).map((row) => row.title)).toEqual(["Vault & Preferences", "Shared Vault", "Security & PIN"]);
    expect(preferenceRowsForVault(sharedVault).map((row) => row.title)).toEqual(["Vault Members"]);
  });

  it("hides Transfers and Reports from the Money section for shared vaults", () => {
    expect(moneyRowsForVault(personalVault).map((row) => row.title)).toEqual(["Transactions", "Transfers", "Categories", "Reports", "Wishlist"]);
    expect(moneyRowsForVault(sharedVault).map((row) => row.title)).toEqual([
      "Transactions",
      "Settlement History",
      "Categories",
      "Wishlist"
    ]);
    expect(moneyRowsForVault(sharedVault).find((row) => row.id === "transactions")?.route).toBe("/shared/transactions");
    expect(moneyRowsForVault(sharedVault).find((row) => row.id === "settlement-history")?.route).toBe("/shared/settlement-history");
  });

  it("switches from personal vault to the first shared vault and back to personal", () => {
    expect(switchTarget(personalVault, [personalVault, sharedVault])).toEqual(sharedVault);
    expect(switchTarget(sharedVault, [personalVault, sharedVault])).toEqual(personalVault);
  });

  it("keeps role labels based on current vault role and type", () => {
    expect(roleLabel(personalVault)).toBe("Owner");
    expect(roleLabel(sharedVault)).toBe("Member");
    expect(roleLabel({ ...sharedVault, role: "owner" })).toBe("Owner");
    expect(roleLabel({ ...sharedVault, isAdmin: true })).toBe("Owner");
  });

  it("resolves placeholder titles for preference routes", () => {
    expect(settingsPlaceholderTitle("security")).toBe("Security & PIN");
    expect(settingsPlaceholderTitle("missing")).toBe("Settings");
  });

  it("filters More menu sections by row title and id", () => {
    const sections = moreMenuSectionsForVault(personalVault);

    expect(filterMoreMenuSections(sections, "report").map((section) => section.rows.map((row) => row.title))).toEqual([["Reports"]]);
    expect(filterMoreMenuSections(sections, "pin").map((section) => section.rows.map((row) => row.title))).toEqual([["Security & PIN"]]);
    expect(filterMoreMenuSections(sections, "logout").map((section) => section.rows.map((row) => row.title))).toEqual([["Logout"]]);
    expect(filterMoreMenuSections(sections, "zzzz")).toEqual([]);
    expect(filterMoreMenuSections(sections, "")).toEqual(sections);
  });

  it("includes Vault Members in searchable sections for shared vaults only", () => {
    const sharedSections = moreMenuSectionsForVault(sharedVault);
    expect(filterMoreMenuSections(sharedSections, "member").map((section) => section.rows.map((row) => row.title))).toEqual([["Vault Members"]]);
    expect(filterMoreMenuSections(moreMenuSectionsForVault(personalVault), "member")).toEqual([]);
  });
});
