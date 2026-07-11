import { EmptyState } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";

export function DashboardPlaceholder() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Foundation"
        title="Dashboard"
        description="The dashboard surface is reserved for Sprint 2 feature work."
      />
      <Section title="Ready for feature modules">
        <EmptyState
          icon="view-dashboard-outline"
          title="No business features yet"
          message="Navigation, theme, providers, and shared components are ready."
        />
      </Section>
    </Screen>
  );
}
