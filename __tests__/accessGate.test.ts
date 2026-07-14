import { targetRouteForAccessState } from "@/lib/accessRoutes";

describe("AccessGate", () => {
  it("routes expired or signed-out sessions to login", () => {
    expect(targetRouteForAccessState("signed-out")).toBe("/sign-in");
  });
});
