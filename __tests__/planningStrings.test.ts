declare const process: { cwd: () => string };
declare function require(name: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");

const planningFiles = [
  "features/planning/PlanningScreen.tsx",
  "features/planning/activityPresentation.ts",
  "features/planning/components/activities/ActivityGroupSection.tsx",
  "features/planning/components/activities/ActivityViewOptionsSheet.tsx",
  "features/planning/components/activities/ActivityViewOptionsButton.tsx",
  "features/planning/components/activities/ActivityInsightLine.tsx",
  "features/planning/components/activities/ActivityFilterSheet.tsx",
  "features/planning/components/activities/ActivityFilterButton.tsx",
  "features/planning/components/activities/ActivityListRow.tsx",
  "features/planning/components/activities/ActivityStatusTabs.tsx",
  "features/planning/components/activities/FinancialActivitiesSection.tsx",
  "features/planning/closeCyclePresentation.ts",
  "features/planning/components/CloseCycleSheet.tsx",
  "features/planning/components/CloseCycleCard.tsx",
  "features/planning/planningModel.ts",
  "features/planning/components/PlanningHeader.tsx",
  "features/planning/components/PlanningActivityRow.tsx",
  "features/planning/components/PlanningItemSheet.tsx",
  "features/planning/components/CyclePickerSheet.tsx",
  "features/planning/components/FinancialActivitiesCard.tsx",
  "features/planning/summaryPresentation.ts",
  "features/planning/components/summary/PlanningSummary.tsx",
  "features/planning/components/summary/PlanningSummaryCard.tsx",
  "features/planning/components/summary/IncomeSummaryCard.tsx",
  "features/planning/components/summary/CommitmentsSummaryCard.tsx",
  "features/planning/components/PlanningSummaryCard.tsx"
];

describe("Planning strings", () => {
  it("does not contain Unicode replacement characters", () => {
    for (const file of planningFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).not.toContain("\uFFFD");
      expect(source.includes(String.fromCharCode(0xfffd))).toBe(false);
      expect(source).not.toContain("???");
    }
  });
});
