import { needsAccessRedirect, targetRouteForAccessState } from "@/lib/accessRoutes";

describe("AccessGate", () => {
  it("routes expired or signed-out sessions to login", () => {
    expect(targetRouteForAccessState("signed-out")).toBe("/welcome");
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

  it("keeps signed-out users on welcome, sign-in, sign-up, and forgot-pin", () => {
    expect(needsAccessRedirect("signed-out", "/welcome")).toBe(false);
    expect(needsAccessRedirect("signed-out", "/sign-in")).toBe(false);
    expect(needsAccessRedirect("signed-out", "/sign-up")).toBe(false);
    expect(needsAccessRedirect("signed-out", "/forgot-pin")).toBe(false);
    expect(needsAccessRedirect("signed-out", "/sign-in")).toBe(false);
    expect(needsAccessRedirect("signed-out", "/")).toBe(true);
    expect(needsAccessRedirect("signed-out", "/onboarding")).toBe(true);
  });

  it("keeps onboarding users on onboarding only", () => {
    expect(needsAccessRedirect("onboarding", "/onboarding")).toBe(false);
    expect(needsAccessRedirect("onboarding", "/welcome")).toBe(true);
    expect(needsAccessRedirect("onboarding", "/")).toBe(true);
  });

  it("sends ready users off auth and onboarding onto the app, and leaves them on app routes", () => {
    expect(needsAccessRedirect("ready", "/welcome")).toBe(true);
    expect(needsAccessRedirect("ready", "/sign-in")).toBe(true);
    expect(needsAccessRedirect("ready", "/sign-up")).toBe(true);
    expect(needsAccessRedirect("ready", "/onboarding")).toBe(true);
    expect(needsAccessRedirect("ready", "/recovery-code")).toBe(true);
    expect(needsAccessRedirect("ready", "/")).toBe(false);
    expect(needsAccessRedirect("ready", "/accounts")).toBe(false);
  });

  it("routes authenticated users with a pending recovery code to the recovery screen", () => {
    expect(targetRouteForAccessState("ready", { pendingRecoveryCode: true })).toBe("/recovery-code");
    expect(targetRouteForAccessState("onboarding", { pendingRecoveryCode: true })).toBe("/recovery-code");
    expect(needsAccessRedirect("ready", "/recovery-code", { pendingRecoveryCode: true })).toBe(false);
    expect(needsAccessRedirect("onboarding", "/sign-up", { pendingRecoveryCode: true })).toBe(true);
  });

  it("does not redirect while booting", () => {
    expect(needsAccessRedirect("booting", "/welcome")).toBe(false);
    expect(needsAccessRedirect("booting", "/")).toBe(false);
  });
});
