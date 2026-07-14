import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function PinUnlockRoute() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Vault lock"
        title="PIN unlock"
        description="Vault PIN checks are owned by the Money Vault backend API."
      />
      <EmptyState
        icon="lock-outline"
        title="Legacy route placeholder"
        message="The active access gate no longer routes here while backend login owns PIN authentication."
      />
    </Screen>
  );
}
