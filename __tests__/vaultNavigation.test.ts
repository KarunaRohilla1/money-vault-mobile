import { moreActionsForVault, personalTabsHiddenForVault } from "@/lib/vaultNavigation";

const personalVault = {
  id: "1",
  isAdmin: true,
  name: "Personal",
  vaultType: "Individual"
};

const sharedVault = {
  id: "2",
  isAdmin: false,
  name: "Shared",
  vaultType: "Shared"
};

describe("vault navigation", () => {
  it("keeps personal navigation visible for Individual vaults", () => {
    expect(personalTabsHiddenForVault(personalVault)).toBe(false);
    expect(moreActionsForVault(personalVault)).toEqual([
      "transactions",
      "transfers",
      "categories",
      "shared",
      "reports",
      "wishlist",
      "settings"
    ]);
  });

  it("hides personal-only navigation for Shared vaults", () => {
    expect(personalTabsHiddenForVault(sharedVault)).toBe(true);
    expect(moreActionsForVault(sharedVault)).toEqual(["shared-expenses", "bills", "settings"]);
  });
});
