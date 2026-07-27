import {
  closeCycleActionOptions,
  closeCycleActionTitle,
  closeCycleAmountLabel,
  closeCycleItemCountLabel,
  closeCycleSelectedSummary,
  closeCycleValidationText,
  formatCloseCycleCurrency,
  shouldShowCloseCycleAmountField
} from "@/features/planning/closeCycleUi";
import type { CloseReviewItem, PlanningActivityViewModel } from "@/features/planning/planningModel";

declare const require: (moduleName: "fs") => { readFileSync: (path: string, encoding: "utf8") => string };
const { readFileSync } = require("fs");


function activity(id: number, kind: "commitment" | "income", name = kind === "income" ? "Salary" : "MF2"): PlanningActivityViewModel {
  return {
    accountId: 1,
    accountName: "HDFC",
    actualAmount: 10,
    actualEntered: false,
    completeLabel: kind === "income" ? "Received" : "Paid",
    completeStatus: kind === "income" ? "RECEIVED" : "PAID",
    dueDay: id,
    expectedAmount: 10,
    icon: kind === "income" ? "cash" : "home-outline",
    id,
    kind,
    name,
    notes: null,
    status: "PENDING",
    statusLabel: "Pending",
    timelineLabel: "Overdue"
  };
}

function item(kind: "commitment" | "income", patch: Partial<CloseReviewItem> = {}): CloseReviewItem {
  return {
    action: null,
    activity: activity(1, kind),
    amount: "10",
    ...patch
  };
}

describe("close cycle UI helpers", () => {
  it("orders commitment actions vertically by common resolution", () => {
    expect(closeCycleActionOptions("commitment").map((option) => [option.action, option.label, option.description])).toEqual([
      ["Paid", "Paid", "Record payment"],
      ["Carry Forward", "Carry Forward", "Move to next cycle"],
      ["Cancelled", "Cancelled", "Ignore this commitment"]
    ]);
  });

  it("orders income actions vertically by common resolution", () => {
    expect(closeCycleActionOptions("income").map((option) => [option.action, option.label, option.description])).toEqual([
      ["Paid", "Received", "Record income"],
      ["Carry Forward", "Carry Forward", "Move to next cycle"],
      ["Cancelled", "Skipped", "Ignore this income"]
    ]);
  });

  it("keeps domain action values while exposing user-facing labels", () => {
    expect(closeCycleActionTitle("Paid", "income")).toBe("Received");
    expect(closeCycleActionTitle("Paid", "commitment")).toBe("Paid");
    expect(closeCycleActionTitle("Cancelled", "income")).toBe("Skipped");
    expect(closeCycleActionTitle("Cancelled", "commitment")).toBe("Cancelled");
    expect(closeCycleActionTitle("Carry Forward", "commitment")).toBe("Carry Forward");
  });

  it("shows amount fields only for existing amount-required actions", () => {
    expect(shouldShowCloseCycleAmountField("Paid")).toBe(true);
    expect(shouldShowCloseCycleAmountField("Carry Forward")).toBe(true);
    expect(shouldShowCloseCycleAmountField("Cancelled")).toBe(false);
    expect(shouldShowCloseCycleAmountField(null)).toBe(false);
  });

  it("labels amount fields for paid, received, and carry-forward states", () => {
    expect(closeCycleAmountLabel("Paid", "commitment")).toBe("Actual (Paid)");
    expect(closeCycleAmountLabel("Paid", "income")).toBe("Actual (Received)");
    expect(closeCycleAmountLabel("Carry Forward", "commitment")).toBe("Carry-forward amount");
    expect(closeCycleAmountLabel("Cancelled", "income")).toBeNull();
  });

  it("uses lightweight validation copy", () => {
    expect(closeCycleValidationText("Choose an action.")).toBe("Select how this item should be resolved.");
    expect(closeCycleValidationText("Enter an amount greater than zero.")).toBe("Enter an amount greater than zero.");
    expect(closeCycleValidationText(null)).toBeNull();
  });

  it("shows selected resolution summaries on collapsed cards", () => {
    expect(closeCycleSelectedSummary(item("commitment", { action: "Paid", amount: "35000" }), "INR", "en-IN")).toBe("Selected: Paid - \u20b935,000");
    expect(closeCycleSelectedSummary(item("income", { action: "Paid", amount: "128500" }), "INR", "en-IN")).toBe("Selected: Received - \u20b91,28,500");
    expect(closeCycleSelectedSummary(item("commitment", { action: "Cancelled", amount: "0" }), "INR", "en-IN")).toBe("Selected: Cancelled");
    expect(closeCycleSelectedSummary(item("income"), "INR", "en-IN")).toBeNull();
  });

  it("formats compact summary counts and en-IN currency", () => {
    expect(closeCycleItemCountLabel(1)).toBe("1 item");
    expect(closeCycleItemCountLabel(2)).toBe("2 items");
    expect(formatCloseCycleCurrency(0, "INR", "en-IN")).toBe("\u20b90");
    expect(formatCloseCycleCurrency(10, "INR", "en-IN")).toBe("\u20b910");
    expect(formatCloseCycleCurrency(35000, "INR", "en-IN")).toBe("\u20b935,000");
    expect(formatCloseCycleCurrency(206350, "INR", "en-IN")).toBe("\u20b92,06,350");
  });

  it("does not reintroduce clipped action text props or replacement glyphs", () => {
    const files = [
      "features/planning/components/close-cycle/CloseCycleResolutionOptions.tsx",
      "features/planning/components/close-cycle/CloseCycleItemCard.tsx",
      "features/planning/components/close-cycle/CloseCycleAmountSection.tsx",
      "features/planning/components/close-cycle/CloseCycleLiveSummary.tsx"
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(source).not.toContain("numberOfLines");
    expect(source).not.toContain("ellipsizeMode");
    expect(source).not.toContain("\uFFFD");
  });
});
