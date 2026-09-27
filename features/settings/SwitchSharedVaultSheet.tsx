import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheet, PrimaryButton, SecondaryButton } from "@/components/ui";
import { sharedVaultMemberCountLabel } from "@/features/settings/sharedVaultModel";
import type { SharedVaultSummaryApi } from "@/services/api/types";
import { theme } from "@/theme";

export function SwitchSharedVaultSheet({
  activeVaultId,
  isSharedActive,
  onCancel,
  onConfirm,
  onSelect,
  personalVault,
  selectedVaultId,
  switching,
  vaults,
  visible
}: {
  activeVaultId?: number | string | null | undefined;
  isSharedActive?: boolean | undefined;
  onCancel: () => void;
  onConfirm: () => void;
  onSelect: (vaultId: number | string) => void;
  personalVault?: { id: number | string; name: string } | null | undefined;
  selectedVaultId: number | string | null;
  switching: boolean;
  vaults: SharedVaultSummaryApi[];
  visible: boolean;
}) {
  const showPersonal = Boolean(
    personalVault &&
      (isSharedActive != null
        ? isSharedActive
        : activeVaultId != null && String(activeVaultId) !== String(personalVault.id))
  );

  const selectableSharedVaults = vaults.filter(
    (vault) => activeVaultId == null || String(vault.id) !== String(activeVaultId)
  );

  return (
    <BottomSheet visible={visible} title="Switch Vault" onClose={onCancel}>
      <View className="gap-4">
        <Text className="font-sans text-sm text-text-muted">Choose which vault you want to make active.</Text>
        <View className="gap-2">
          {showPersonal && personalVault ? (
            <Pressable
              accessibilityLabel={`${personalVault.name}, Personal Vault`}
              accessibilityRole="button"
              accessibilityState={{ selected: String(selectedVaultId) === String(personalVault.id) }}
              className={`min-h-14 flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
                String(selectedVaultId) === String(personalVault.id)
                  ? "border-brand-soft bg-brand-deep"
                  : "border-surface-border bg-surface"
              }`}
              key={`personal-${personalVault.id}`}
              onPress={() => onSelect(personalVault.id)}
            >
              <MaterialCommunityIcons
                name={String(selectedVaultId) === String(personalVault.id) ? "radiobox-marked" : "radiobox-blank"}
                size={theme.icons.md}
                color={String(selectedVaultId) === String(personalVault.id) ? theme.colors.brand.soft : theme.colors.text.muted}
              />
              <View className="min-w-0 flex-1">
                <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
                  {personalVault.name}
                </Text>
                <Text className="mt-0.5 font-sans text-sm text-text-muted">Personal Vault</Text>
              </View>
            </Pressable>
          ) : null}
          {selectableSharedVaults.map((vault) => {
            const selected = String(selectedVaultId) === String(vault.id);
            return (
              <Pressable
                accessibilityLabel={`${vault.name}, ${sharedVaultMemberCountLabel(vault.memberCount)}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-14 flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
                  selected ? "border-brand-soft bg-brand-deep" : "border-surface-border bg-surface"
                }`}
                key={`shared-${vault.id}`}
                onPress={() => onSelect(vault.id)}
              >
                <MaterialCommunityIcons
                  name={selected ? "radiobox-marked" : "radiobox-blank"}
                  size={theme.icons.md}
                  color={selected ? theme.colors.brand.soft : theme.colors.text.muted}
                />
                <View className="min-w-0 flex-1">
                  <Text className="font-sans text-base font-semibold text-text" numberOfLines={1}>
                    {vault.name}
                  </Text>
                  <Text className="mt-0.5 font-sans text-sm text-text-muted">
                    {sharedVaultMemberCountLabel(vault.memberCount)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View className="gap-3 pt-1">
          <PrimaryButton disabled={selectedVaultId == null || switching} loading={switching} onPress={onConfirm}>
            Switch
          </PrimaryButton>
          <SecondaryButton disabled={switching} onPress={onCancel}>
            Cancel
          </SecondaryButton>
        </View>
      </View>
    </BottomSheet>
  );
}
