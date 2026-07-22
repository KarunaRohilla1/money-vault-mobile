import {
  moneyRows,
  preferenceRows,
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
    expect(preferenceRows.map((row) => row.title)).toEqual([
      "Security & PIN",
      "Vault Members",
      "Notifications",
      "Data & Backup",
      "Appearance",
      "About Money Vault"
    ]);
    expect(preferenceRows.map((row) => row.route)).toEqual([
      "/settings/security",
      "/settings/members",
      "/settings/notifications",
      "/settings/backup",
      "/settings/appearance",
      "/settings/about"
    ]);
  });

  it("switches from personal vault to the first shared vault and back to personal", () => {
    expect(switchTarget(personalVault, [personalVault, sharedVault])).toEqual(sharedVault);
    expect(switchTarget(sharedVault, [personalVault, sharedVault])).toEqual(personalVault);
  });

  it("keeps role labels based on current vault admin status", () => {
    expect(roleLabel(personalVault)).toBe("Admin");
    expect(roleLabel(sharedVault)).toBe("Member");
  });

  it("resolves placeholder titles for preference routes", () => {
    expect(settingsPlaceholderTitle("security")).toBe("Security & PIN");
    expect(settingsPlaceholderTitle("missing")).toBe("Settings");
  });
});
