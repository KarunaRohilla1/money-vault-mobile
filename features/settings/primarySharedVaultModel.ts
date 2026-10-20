import {
  sharedVaultMemberCountLabel,
  sharedVaultRoleLabel
} from "@/features/settings/sharedVaultModel";
import type { SharedVaultSummaryApi } from "@/services/api/types";

export const PRIMARY_SHARED_VAULT_NONE_ID = "none" as const;

export type PrimarySharedVaultOptionId = number | typeof PRIMARY_SHARED_VAULT_NONE_ID;

export interface PrimarySharedVaultOption {
  description: string;
  id: PrimarySharedVaultOptionId;
  title: string;
}

export const PRIMARY_SHARED_VAULT_NONE_OPTION: PrimarySharedVaultOption = {
  description: "Do not show shared settlement totals on the Personal Dashboard.",
  id: PRIMARY_SHARED_VAULT_NONE_ID,
  title: "None"
};

export function primarySharedVaultOptions(vaults: SharedVaultSummaryApi[]): PrimarySharedVaultOption[] {
  return [
    PRIMARY_SHARED_VAULT_NONE_OPTION,
    ...vaults.map((vault) => ({
      description: `${sharedVaultMemberCountLabel(vault.memberCount)} · ${sharedVaultRoleLabel(vault.role)}`,
      id: vault.id,
      title: vault.name
    }))
  ];
}

export function selectedPrimarySharedVaultId(configuredId: number | null | undefined): PrimarySharedVaultOptionId {
  return configuredId == null ? PRIMARY_SHARED_VAULT_NONE_ID : configuredId;
}

export function selectedPrimarySharedVaultOption(
  options: PrimarySharedVaultOption[],
  configuredId: number | null | undefined
): PrimarySharedVaultOption {
  const selectedId = selectedPrimarySharedVaultId(configuredId);
  return options.find((option) => String(option.id) === String(selectedId)) ?? PRIMARY_SHARED_VAULT_NONE_OPTION;
}

export function isPrimarySharedVaultNone(optionId: PrimarySharedVaultOptionId) {
  return optionId === PRIMARY_SHARED_VAULT_NONE_ID;
}
