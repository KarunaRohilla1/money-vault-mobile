import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Share, Switch, Text, TextInput, View } from "react-native";

import { FormField } from "@/components/forms/FormField";
import { Screen } from "@/components/layout/Screen";
import { EmptyState, ErrorView, LoadingSkeleton, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  isSharedVaultDashboardTogglePending,
  isSharedVaultSafeToSpendTogglePending,
  sharedVaultDashboardVisibilityMutationKey,
  sharedVaultSafeToSpendInclusionMutationKey,
  useSharedVaultDashboardVisibilityMutation,
  useSharedVaultSafeToSpendInclusionMutation
} from "@/features/settings/api";
import { isSharedVault } from "@/features/settings/moreModel";
import {
  canManageSharedVaultAsOwner,
  sharedVaultMemberCountLabel,
  sharedVaultRoleLabel,
  sharedVaultsForSwitch
} from "@/features/settings/sharedVaultModel";
import { SwitchSharedVaultSheet } from "@/features/settings/SwitchSharedVaultSheet";
import { goBackOrReplace } from "@/lib/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { showToast } from "@/lib/toast";
import { apiClient, ApiClientError } from "@/services/api/client";
import { activatePersonalVaultSession, activateSharedVaultSession, sessionExtras } from "@/services/api/session";
import type { SharedVaultMemberApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

function PreferenceSwitchRow({
  checked,
  description,
  disabled,
  label,
  onValueChange
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-3">
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
        <Text className="mt-0.5 font-sans text-xs text-text-muted">{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        ios_backgroundColor={theme.colors.surface.pressed}
        onValueChange={onValueChange}
        thumbColor={theme.colors.text.DEFAULT}
        trackColor={{ false: theme.colors.surface.pressed, true: theme.colors.brand.DEFAULT }}
        value={checked}
      />
    </View>
  );
}

function MemberRow({
  canRemove,
  member,
  onRemove,
  removing
}: {
  canRemove: boolean;
  member: SharedVaultMemberApi;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <View className="min-h-16 flex-row items-center gap-4 border-b border-surface-border py-3 last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-deep">
        <Text className="font-sans text-sm font-bold text-brand-soft">
          {member.displayName.trim().slice(0, 2).toUpperCase() || "MV"}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
          {member.displayName}
          {member.isCurrentUser ? " (You)" : ""}
        </Text>
        <Text className="mt-1 font-sans text-sm text-text-muted">{sharedVaultRoleLabel(member.role)}</Text>
      </View>
      {canRemove ? (
        <Pressable accessibilityLabel={`Remove ${member.displayName}`} disabled={removing} onPress={onRemove}>
          <Text className="font-sans text-sm font-semibold text-state-danger">{removing ? "..." : "Remove"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ManageSharedVaultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ vaultId?: string }>();
  const sharedVaultId = Number(params.vaultId);
  const token = useAuthStore((state) => state.token);
  const activeVault = useAuthStore((state) => state.vault);
  const authenticatedVault = useAuthStore((state) => state.authenticatedVault);
  const activeVaultId = activeVault?.id ?? null;
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const personalVaultId = authenticatedVault?.id ?? activeVaultId;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<number | string | null>(null);

  const [vaultName, setVaultName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detailQuery = useQuery({
    enabled: Boolean(token) && Number.isFinite(sharedVaultId) && sharedVaultId > 0,
    queryFn: async () => apiClient.getSharedVaultDetail(token ?? "", sharedVaultId),
    queryKey: queryKeys.vaults.sharedDetail(sharedVaultId)
  });

  const sharedVaultsQuery = useQuery({
    enabled: Boolean(token),
    queryFn: async () => apiClient.getSharedVaults(token ?? ""),
    queryKey: queryKeys.vaults.shared
  });
  const vaults = useMemo(() => sharedVaultsForSwitch(sharedVaultsQuery.data ?? []), [sharedVaultsQuery.data]);
  const vaultSummary = useMemo(
    () => vaults.find((vault) => Number(vault.id) === sharedVaultId) ?? sharedVaultsQuery.data?.find((vault) => Number(vault.id) === sharedVaultId),
    [sharedVaultId, sharedVaultsQuery.data, vaults]
  );
  const includeMutation = useSharedVaultSafeToSpendInclusionMutation(token, personalVaultId);
  const showMutation = useSharedVaultDashboardVisibilityMutation(token, personalVaultId);
  const pendingInclusionVaultIds = useMutationState({
    filters: { mutationKey: sharedVaultSafeToSpendInclusionMutationKey, status: "pending" },
    select: (mutation) => (mutation.state.variables as { sharedVaultId?: number } | undefined)?.sharedVaultId
  });
  const pendingShowVaultIds = useMutationState({
    filters: { mutationKey: sharedVaultDashboardVisibilityMutationKey, status: "pending" },
    select: (mutation) => (mutation.state.variables as { sharedVaultId?: number } | undefined)?.sharedVaultId
  });
  const includeDisabled = isSharedVaultSafeToSpendTogglePending(pendingInclusionVaultIds, sharedVaultId);
  const showDisabled = isSharedVaultDashboardTogglePending(pendingShowVaultIds, sharedVaultId);
  const included = vaultSummary?.includeInSafeToSpend !== false;
  const shown = vaultSummary?.showOnDashboard !== false;
  const isActiveShared = String(activeVaultId) === String(sharedVaultId) && isSharedVault(activeVault);

  const detail = detailQuery.data;
  const isOwner = canManageSharedVaultAsOwner(detail?.role ?? "member");

  const switchMutation = useMutation({
    mutationFn: async (targetVaultId: number | string) => {
      if (!token) {
        throw new Error("No authenticated session.");
      }
      if (String(targetVaultId) === String(authenticatedVault?.id) || targetVaultId === "personal") {
        return activatePersonalVaultSession(token);
      }
      return activateSharedVaultSession(token, { sharedVaultId: Number(targetVaultId) });
    },
    onError: () => {
      showToast("Vault could not be switched. Try again.");
    },
    onSuccess: (response) => {
      setPickerVisible(false);
      setSelectedVaultId(null);
      setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault, sessionExtras(response));
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.effective(response.vault.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
      showToast(`Switched to ${response.vault.name}`);
      router.replace("/");
    }
  });

  useEffect(() => {
    if (detail?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVaultName(detail.name);
    }
  }, [detail?.name]);

  const invalidateShared = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vaults.shared });
    await queryClient.invalidateQueries({ queryKey: queryKeys.vaults.sharedDetail(sharedVaultId) });
  };

  const ensurePersonalIfActive = async () => {
    if (!token || activeVaultId !== String(sharedVaultId)) {
      return;
    }
    const response = await activatePersonalVaultSession(token);
    setAuthenticated(response.token, response.vault, response.authenticatedVault ?? response.vault, sessionExtras(response));
  };

  const renameMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No authenticated session.");
      }
      const trimmed = vaultName.trim();
      if (!trimmed) {
        throw new Error("Vault name is required.");
      }
      return apiClient.renameSharedVault(token, sharedVaultId, { vaultName: trimmed });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : "Name could not be updated.");
    },
    onSuccess: async () => {
      setError(null);
      setRenameOpen(false);
      showToast("Vault name updated.");
      await invalidateShared();
    }
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No authenticated session.");
      }
      await apiClient.leaveSharedVault(token, sharedVaultId);
      await ensurePersonalIfActive();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : "Could not leave vault.");
      setConfirmLeave(false);
    },
    onSuccess: async () => {
      setConfirmLeave(false);
      showToast("You left the shared vault.");
      await invalidateShared();
      goBackOrReplace(router, "/settings/shared-vault");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No authenticated session.");
      }
      await apiClient.deleteSharedVault(token, sharedVaultId);
      await ensurePersonalIfActive();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : "Vault could not be deleted.");
      setConfirmDelete(false);
    },
    onSuccess: async () => {
      setConfirmDelete(false);
      showToast("Shared vault deleted.");
      await invalidateShared();
      goBackOrReplace(router, "/settings/shared-vault");
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      if (!token) {
        throw new Error("No authenticated session.");
      }
      setRemovingUserId(memberUserId);
      await apiClient.removeSharedVaultMember(token, sharedVaultId, memberUserId);
    },
    onError: (err) => {
      setRemovingUserId(null);
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : "Member could not be removed.");
    },
    onSuccess: async () => {
      setRemovingUserId(null);
      showToast("Member removed.");
      await invalidateShared();
      await detailQuery.refetch();
    }
  });

  const members = useMemo(() => detail?.members ?? [], [detail?.members]);

  const copyInviteCode = async () => {
    if (!detail?.inviteCode) {
      return;
    }
    await Clipboard.setStringAsync(detail.inviteCode);
    showToast("Invite code copied.");
  };

  const shareInviteCode = async () => {
    if (!detail?.inviteCode) {
      return;
    }
    await Share.share({
      message: `Join my Money Vault shared vault with invite code: ${detail.inviteCode}`
    });
  };

  return (
    <Screen
      contentClassName="gap-5 px-5 pb-28 pt-4"
      onRefresh={() => {
        void detailQuery.refetch();
        void sharedVaultsQuery.refetch();
      }}
      refreshing={detailQuery.isRefetching || sharedVaultsQuery.isRefetching}
    >
      <View className="relative items-center gap-3 pt-2">
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-0 top-0 z-10 h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-background-muted"
          onPress={() => goBackOrReplace(router, "/settings/shared-vault")}
        >
          <MaterialCommunityIcons name="arrow-left" size={theme.icons.md} color={theme.colors.text.DEFAULT} />
        </Pressable>
        <View className="items-center gap-1">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-deep">
            <MaterialCommunityIcons name="cog-outline" size={theme.icons.lg} color={theme.colors.brand.soft} />
          </View>
          <Text className="font-sans text-3xl font-bold text-text">Manage</Text>
          <Text className="font-sans text-sm text-text-muted" numberOfLines={1}>
            {detail?.name ?? "Shared Vault"}
          </Text>
        </View>
      </View>

      {detailQuery.isLoading ? <LoadingSkeleton variant="card" /> : null}
      {detailQuery.isError ? (
        <ErrorView message="Shared vault details could not be loaded." onRetry={() => detailQuery.refetch()} />
      ) : null}

      {error ? (
        <View className="rounded-lg bg-state-danger/10 px-4 py-3">
          <Text className="font-sans text-sm text-state-danger">{error}</Text>
        </View>
      ) : null}

      {detail ? (
        <>
          <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
            <Text className="font-sans text-sm font-bold uppercase text-text-muted">Vault</Text>
            <Text className="font-sans text-xl font-bold text-text">{detail.name}</Text>
            <Text className="font-sans text-sm text-text-muted">
              {sharedVaultMemberCountLabel(detail.memberCount)} · {sharedVaultRoleLabel(detail.role)}
            </Text>
            {isOwner ? (
              <SecondaryButton className="mt-2" onPress={() => setRenameOpen(true)}>
                Edit Name
              </SecondaryButton>
            ) : null}
            <SecondaryButton
              className="mt-1"
              disabled={switchMutation.isPending || isActiveShared}
              onPress={() => {
                if (isActiveShared) {
                  return;
                }
                setSelectedVaultId(sharedVaultId);
                setPickerVisible(true);
              }}
            >
              {switchMutation.isPending ? "Switching..." : isActiveShared ? "Active" : "Switch Vault"}
            </SecondaryButton>
          </View>

          <View className="rounded-xl border border-surface-border bg-surface px-4">
            <Text className="pt-3 font-sans text-sm font-bold uppercase text-text-muted">Preferences</Text>
            <PreferenceSwitchRow
              checked={included}
              description="Use this vault’s outstanding balance in Personal Safe to Spend."
              disabled={includeDisabled}
              label="Include in Safe to Spend"
              onValueChange={(value) => {
                if (includeDisabled) {
                  return;
                }
                includeMutation.mutate(
                  { includeInSafeToSpend: value, sharedVaultId },
                  {
                    onError: () => showToast("Safe to Spend inclusion could not be updated. Try again."),
                    onSuccess: () => showToast(value ? "Included in Safe to Spend." : "Excluded from Safe to Spend.")
                  }
                );
              }}
            />
            <View className="border-t border-surface-border">
              <PreferenceSwitchRow
                checked={shown}
                description="Show this vault’s balance card on your Personal Dashboard."
                disabled={showDisabled}
                label="Show on Dashboard"
                onValueChange={(value) => {
                  if (showDisabled) {
                    return;
                  }
                  showMutation.mutate(
                    { sharedVaultId, showOnDashboard: value },
                    {
                      onError: () => showToast("Dashboard visibility could not be updated. Try again."),
                      onSuccess: () => showToast(value ? "Shown on dashboard." : "Hidden from dashboard.")
                    }
                  );
                }}
              />
            </View>
          </View>

          {isOwner && detail.inviteCode ? (
            <View className="gap-3 rounded-xl border border-surface-border bg-surface p-4">
              <Text className="font-sans text-sm font-bold uppercase text-text-muted">Invite Members</Text>
              <Text selectable className="font-sans text-2xl font-bold tracking-widest text-brand-soft">
                {detail.inviteCode}
              </Text>
              <View className="flex-row gap-3">
                <SecondaryButton className="flex-1" onPress={copyInviteCode}>
                  Copy
                </SecondaryButton>
                <SecondaryButton className="flex-1" onPress={shareInviteCode}>
                  Share
                </SecondaryButton>
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            <Text className="font-sans text-sm font-bold uppercase text-text-muted">
              Members · {sharedVaultMemberCountLabel(detail.memberCount)}
            </Text>
            {members.length === 0 ? (
              <EmptyState icon="account-group-outline" title="No members" message="Members of this shared vault will appear here." />
            ) : (
              <View className="rounded-xl border border-surface-border bg-surface px-4">
                {members.map((member) => (
                  <MemberRow
                    canRemove={isOwner && !member.isCurrentUser}
                    key={member.userId}
                    member={member}
                    onRemove={() => removeMutation.mutate(member.userId)}
                    removing={removeMutation.isPending && removingUserId === member.userId}
                  />
                ))}
              </View>
            )}
          </View>

          <View className="gap-3">
            {!isOwner || members.filter((member) => member.role === "owner").length > 1 ? (
              <SecondaryButton onPress={() => setConfirmLeave(true)}>Leave Vault</SecondaryButton>
            ) : null}
            {isOwner ? (
              <Pressable
                accessibilityLabel="Delete Shared Vault"
                accessibilityRole="button"
                className="min-h-12 items-center justify-center rounded-lg border border-state-danger/40 px-4"
                onPress={() => setConfirmDelete(true)}
              >
                <Text className="font-sans text-sm font-bold text-state-danger">Delete Shared Vault</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}

      <Modal animationType="fade" transparent visible={renameOpen} onRequestClose={() => setRenameOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-5">
            <Text className="font-sans text-xl font-bold text-text">Edit Name</Text>
            <FormField label="Vault Name">
              <TextInput
                autoCapitalize="words"
                className="rounded-lg border border-surface-border bg-background-muted px-4 py-3 font-sans text-base text-text"
                onChangeText={setVaultName}
                placeholderTextColor={theme.colors.text.muted}
                value={vaultName}
              />
            </FormField>
            <PrimaryButton loading={renameMutation.isPending} onPress={() => renameMutation.mutate()}>
              Save
            </PrimaryButton>
            <SecondaryButton disabled={renameMutation.isPending} onPress={() => setRenameOpen(false)}>
              Cancel
            </SecondaryButton>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={confirmLeave} onRequestClose={() => setConfirmLeave(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-5">
            <Text className="font-sans text-xl font-bold text-text">Leave Shared Vault?</Text>
            <Text className="font-sans text-sm text-text-muted">You will lose access until you are invited again.</Text>
            <PrimaryButton loading={leaveMutation.isPending} onPress={() => leaveMutation.mutate()}>
              Leave Vault
            </PrimaryButton>
            <SecondaryButton disabled={leaveMutation.isPending} onPress={() => setConfirmLeave(false)}>
              Cancel
            </SecondaryButton>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={confirmDelete} onRequestClose={() => setConfirmDelete(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-5">
            <Text className="font-sans text-xl font-bold text-text">Delete Shared Vault?</Text>
            <Text className="font-sans text-sm text-text-muted">
              This permanently removes the shared vault for all members. Personal vaults are not affected.
            </Text>
            <PrimaryButton loading={deleteMutation.isPending} onPress={() => deleteMutation.mutate()}>
              Delete Vault
            </PrimaryButton>
            <SecondaryButton disabled={deleteMutation.isPending} onPress={() => setConfirmDelete(false)}>
              Cancel
            </SecondaryButton>
          </View>
        </View>
      </Modal>

      <SwitchSharedVaultSheet
        activeVaultId={activeVaultId}
        isSharedActive={isSharedVault(activeVault)}
        onCancel={() => {
          if (!switchMutation.isPending) {
            setPickerVisible(false);
            setSelectedVaultId(null);
          }
        }}
        onConfirm={() => {
          if (selectedVaultId == null) {
            return;
          }
          switchMutation.mutate(selectedVaultId);
        }}
        onSelect={setSelectedVaultId}
        personalVault={authenticatedVault ? { id: authenticatedVault.id, name: authenticatedVault.name } : null}
        selectedVaultId={selectedVaultId}
        switching={switchMutation.isPending}
        vaults={vaults}
        visible={pickerVisible}
      />
    </Screen>
  );
}
