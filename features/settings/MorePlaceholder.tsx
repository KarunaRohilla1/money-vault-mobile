import { EmptyState, SecondaryButton } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";

export function MorePlaceholder() {
  return (
    <Screen>
      <ScreenHeader title="More" description="Settings, reports, vault controls, and profile actions will live here." />
      <Section title="Application foundation">
        <EmptyState
          icon="dots-horizontal-circle-outline"
          title="More tools are pending"
          message="Shared settings and theme stores are already available for future flows."
          action={<SecondaryButton icon="shield-check-outline">Foundation ready</SecondaryButton>}
        />
      </Section>
    </Screen>
  );
}
