import { bottomTabMetrics } from "@/lib/bottomTabMetrics";

describe("bottom tab safe-area metrics", () => {
  it("preserves existing spacing when there is no bottom inset", () => {
    expect(bottomTabMetrics(0)).toEqual({
      fabBottom: 28,
      tabBarHeight: 76,
      tabBarPaddingBottom: 14
    });
  });

  it("adds the safe-area bottom inset for Android system navigation clearance", () => {
    expect(bottomTabMetrics(24)).toEqual({
      fabBottom: 52,
      tabBarHeight: 100,
      tabBarPaddingBottom: 38
    });
  });

  it("ignores invalid negative insets", () => {
    expect(bottomTabMetrics(-8)).toEqual(bottomTabMetrics(0));
  });
});
