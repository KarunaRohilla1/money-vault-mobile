import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/layout/Screen";
import { EmptyState, ErrorView, LoadingSkeleton } from "@/components/ui";
import { dashboardLayout } from "@/features/dashboard/dashboardLayout";
import { useSharedDashboardQuery } from "@/features/shared/api";
import { goBackOrReplace } from "@/lib/navigation";
import type { SharedDashboardParticipantApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

function MemberRow({ participant }: { participant: SharedDashboardParticipantApi }) {
  return (
    <View className="min-h-16 flex-row items-center gap-4 border-b border-surface-border py-3 last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-deep">
        <Text className="font-sans text-sm font-bold text-brand-soft">{participant.avatarInitial}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
          {participant.name}
          {participant.isCurrentUser ? " (You)" : ""}
        </Text>
        <Text className="mt-1 font-sans text-sm text-text-muted">Member</Text>
      </View>
      {participant.isCurrentUser ? (
        <View className="rounded-md bg-brand-deep px-2 py-1">
          <Text className="font-sans text-xs font-bold text-brand-soft">You</Text>
        </View>
      ) : null}
    </View>
  );
}

export function VaultMembersScreen() {
  const router = useRouter();
  const vault = useAuthStore((state) => state.vault);
  const token = useAuthStore((state) => state.token);
  const vaultId = vault?.id ?? null;
  const isSharedVault = vault?.vaultType === "Shared";
  const sharedVaultId = isSharedVault && vaultId ? Number(vaultId) : null;
  const dashboardQuery = useSharedDashboardQuery(token, isSharedVault ? vaultId : null, sharedVaultId);
  const participants = dashboardQuery.data?.data.data.participants ?? [];
  const vaultName = dashboardQuery.data?.data.vault.name ?? vault?.name ?? "Shared Vault";

  return (
    <Screen contentClassName="gap-5 px-4 pb-28 pt-4" onRefresh={() => dashboardQuery.refetch()} refreshing={dashboardQuery.isRefetching}>
      <View className="flex-row items-start gap-4">
        <Pressable accessibilityLabel="Back" accessibilityRole="button" className="h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted" onPress={() => goBackOrReplace(router, "/more")}>
          <MaterialCommunityIcons name="arrow-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="account-group-outline" size={theme.icons.lg} color={theme.colors.brand.soft} />
            <Text className="font-sans text-3xl font-bold text-brand-soft">Vault Members</Text>
          </View>
          <Text className="font-sans text-base text-text">People connected to {vaultName}.</Text>
        </View>
      </View>

      {!isSharedVault ? (
        <EmptyState icon="account-group-outline" title="Members unavailable" message="Switch to a shared vault to view its members." />
      ) : null}

      {isSharedVault && dashboardQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {isSharedVault && dashboardQuery.isError ? <ErrorView message="Vault members could not be loaded." onRetry={() => dashboardQuery.refetch()} /> : null}

      {isSharedVault && dashboardQuery.data ? (
        <View className="gap-3">
          <Text className="font-sans text-sm font-bold uppercase text-text-muted">
            {participants.length} {participants.length === 1 ? "Member" : "Members"}
          </Text>
          {participants.length === 0 ? (
            <EmptyState icon="account-group-outline" title="No members" message="Connected shared-vault participants will appear here." />
          ) : (
            <View className={`${dashboardLayout.cardClassName} px-4`}>
              {participants.map((participant) => (
                <MemberRow key={participant.vaultId} participant={participant} />
              ))}
            </View>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
