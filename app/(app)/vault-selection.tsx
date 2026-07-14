import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function VaultSelectionRoute() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Vault"
        title="Select vault"
        description="Backend sessions include the active vault for the current mobile session."
      />
      <EmptyState
        icon="safe-square-outline"
        title="Legacy route placeholder"
        message="A later backend endpoint can support vault switching without direct database access."
      />
    </Screen>
  );
}
