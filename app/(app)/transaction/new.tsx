import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function NewTransactionRoute() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Placeholder"
        title="New transaction"
        description="The global add action resolves here without implementing transaction entry."
      />
      <EmptyState
        icon="plus-circle-outline"
        title="Transaction creation is not built"
        message="This placeholder reserves the route for a future business feature."
      />
    </Screen>
  );
}
