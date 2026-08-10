import { useRouter } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState, SecondaryButton } from "@/components/ui";
import { goBackOrReplace } from "@/lib/navigation";

interface SharedPlaceholderScreenProps {
  description: string;
  title: string;
}

export function SharedPlaceholderScreen({ description, title }: SharedPlaceholderScreenProps) {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title={title} description={description} />
      <EmptyState icon="hammer-wrench" title={title} message="This screen will be connected in a later slice." />
      <SecondaryButton onPress={() => goBackOrReplace(router, "/")}>Back to Dashboard</SecondaryButton>
    </Screen>
  );
}
