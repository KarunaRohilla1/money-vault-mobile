import { targetRouteForAccessState } from "@/lib/accessRoutes";

describe("AccessGate", () => {
  it("routes expired or signed-out sessions to login", () => {
    expect(targetRouteForAccessState("signed-out")).toBe("/sign-in");
  });

  it("routes authenticated vaults with incomplete setup to onboarding", () => {
    expect(targetRouteForAccessState("onboarding")).toBe("/onboarding");
  });

  it("routes ready sessions to the app root", () => {
    expect(targetRouteForAccessState("ready")).toBe("/");
  });

  it("does not route while booting", () => {
    expect(targetRouteForAccessState("booting")).toBeNull();
  });
});
