import { Link } from "expo-router";
import { Text } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function NotFoundRoute() {
  return (
    <Screen>
      <ScreenHeader title="Not found" description="This route does not exist in Money Vault." />
      <EmptyState
        icon="map-marker-question-outline"
        title="Screen unavailable"
        message="Return to the app foundation."
        action={
          <Link href="/" asChild>
            <Text className="font-sans text-sm font-semibold text-brand-soft">Go home</Text>
          </Link>
        }
      />
    </Screen>
  );
}
