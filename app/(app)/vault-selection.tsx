import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function VaultSelectionRoute() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Vault"
        title="Select vault"
        description="Authenticated users choose their active vault before app tabs become available."
      />
      <EmptyState
        icon="safe-square-outline"
        title="Vault selection placeholder"
        message="This route will list real vaults after Supabase database types are generated."
      />
    </Screen>
  );
}
