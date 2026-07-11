import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function PinUnlockRoute() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Vault lock"
        title="PIN unlock"
        description="Vault PIN unlock is intentionally separate from Supabase authentication."
      />
      <EmptyState
        icon="lock-outline"
        title="PIN unlock placeholder"
        message="A later sprint will validate the local vault unlock secret here."
      />
    </Screen>
  );
}
