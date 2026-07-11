import { EmptyState } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";

export function PlanningPlaceholder() {
  return (
    <Screen>
      <ScreenHeader title="Planning" description="Planning modules will compose onto this route later." />
      <Section title="Planning foundation">
        <EmptyState
          icon="chart-timeline-variant"
          title="Planning is not built yet"
          message="The route exists so the app shell can stabilize first."
        />
      </Section>
    </Screen>
  );
}
