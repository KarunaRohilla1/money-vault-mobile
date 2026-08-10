import { View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { LoadingSkeleton } from "@/components/ui";
import { SharedDashboardHeader } from "@/features/shared/components/SharedDashboardHeader";

export function SharedDashboardSkeleton() {
  return (
    <Screen>
      <SharedDashboardHeader />
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
      <View className="flex-row gap-3">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </View>
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
    </Screen>
  );
}
