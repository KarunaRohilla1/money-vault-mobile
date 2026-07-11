import { EmptyState } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";

export function AccountsPlaceholder() {
  return (
    <Screen>
      <ScreenHeader title="Accounts" description="Account workflows will be implemented in a later sprint." />
      <Section title="Account foundation">
        <EmptyState icon="wallet-outline" title="Accounts are not built yet" message="This screen is intentionally a placeholder." />
      </Section>
    </Screen>
  );
}
