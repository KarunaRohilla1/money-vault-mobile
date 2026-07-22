import { useLocalSearchParams, useRouter } from "expo-router";

import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState, SecondaryButton } from "@/components/ui";
import { settingsPlaceholderTitle } from "@/features/settings/moreModel";

export default function SettingsSectionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const section = typeof params.section === "string" ? params.section : "";
  const title = settingsPlaceholderTitle(section);

  return (
    <Screen>
      <ScreenHeader title={title} description="This setting will be connected in a later slice." />
      <EmptyState icon="cog-outline" title={title} message="This page is a placeholder for the selected vault preference." />
      <SecondaryButton onPress={() => router.back()}>Back</SecondaryButton>
    </Screen>
  );
}
