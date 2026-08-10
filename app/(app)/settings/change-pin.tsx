import { useRouter } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SecondaryButton } from "@/components/ui";
import { goBackOrReplace } from "@/lib/navigation";

export default function ChangePinRoute() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader description="This flow will be connected in a later slice." title="Change PIN" />
      <SecondaryButton onPress={() => goBackOrReplace(router, "/settings/security")}>Back</SecondaryButton>
    </Screen>
  );
}
