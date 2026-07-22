import { activeBottomTab, appShellMetrics, bottomNavItems, shouldShowBottomPanel } from "@/lib/appShell";

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

describe("app shell bottom panel ownership", () => {
  it.each(["/", "/accounts", "/transactions", "/planning", "/shared"])("shows the bottom panel on standard route %s", (pathname) => {
    expect(shouldShowBottomPanel(pathname)).toBe(true);
  });

  it("hides the bottom panel on More", () => {
    expect(shouldShowBottomPanel("/more")).toBe(false);
  });

  it("does not leave a bottom-panel gap when More hides the panel", () => {
    expect(appShellMetrics(24, false)).toMatchObject({
      contentPaddingBottom: 24,
      panelHeight: 0
    });
  });

  it("applies the bottom safe-area inset to the panel, not the content, when the panel is visible", () => {
    expect(appShellMetrics(24, true)).toMatchObject({
      contentPaddingBottom: 0,
      panelHeight: 100,
      tabBarHeight: 100,
      tabBarPaddingBottom: 38
    });
  });

  it("keeps a consistent content height for primary app routes", () => {
    const panelHeights = ["/", "/accounts", "/transactions", "/planning"].map((pathname) => appShellMetrics(16, shouldShowBottomPanel(pathname)).panelHeight);

    expect(new Set(panelHeights)).toEqual(new Set([92]));
  });

  it("positions the FAB using the same safe-area-aware panel metrics", () => {
    expect(appShellMetrics(20, true).fabBottom).toBe(48);
  });

  it("keeps bottom navigation tappable with a non-zero bottom inset", () => {
    expect(appShellMetrics(32, true).tabBarPaddingBottom).toBeGreaterThan(32);
  });

  it("keeps Dashboard, Accounts, Planning and More route targets in the navigation model", () => {
    expect(bottomNavItems("/", personalVault).map((item) => item.route)).toEqual(["/", "/accounts", "/planning", "/more"]);
  });

  it("marks the active tab for primary tabs and leaves child screens without duplicate active tabs", () => {
    expect(activeBottomTab("/")).toBe("index");
    expect(activeBottomTab("/accounts")).toBe("accounts");
    expect(activeBottomTab("/planning")).toBe("planning");
    expect(activeBottomTab("/transactions")).toBeNull();
  });

  it("preserves personal vault navigation items", () => {
    expect(bottomNavItems("/", personalVault).filter((item) => !item.hidden).map((item) => item.name)).toEqual(["index", "accounts", "planning", "more"]);
  });

  it("preserves shared vault navigation restrictions without duplicating a second panel", () => {
    expect(bottomNavItems("/shared", sharedVault).filter((item) => !item.hidden).map((item) => item.name)).toEqual(["index", "more"]);
  });

  it("keeps vault switching reflected in visible navigation items", () => {
    expect(bottomNavItems("/", personalVault).filter((item) => !item.hidden)).toHaveLength(4);
    expect(bottomNavItems("/", sharedVault).filter((item) => !item.hidden)).toHaveLength(2);
  });

  it("does not hide the bottom panel merely because a route is nested", () => {
    expect(shouldShowBottomPanel("/transaction/42")).toBe(true);
    expect(shouldShowBottomPanel("/transfers/history")).toBe(true);
  });
});
