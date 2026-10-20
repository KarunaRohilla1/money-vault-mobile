import type { SharedVaultSummaryApi } from "@/services/api/types";

export type SharedVaultStatusBadge = {
  key: "stsExcluded";
  label: string;
};

export function sharedVaultMemberCountLabel(count: number) {
  return `${count} ${count === 1 ? "member" : "members"}`;
}

export function sharedVaultRoleLabel(role: string) {
  return role === "owner" ? "Owner" : "Member";
}

export function canManageSharedVaultAsOwner(role: string) {
  return role === "owner";
}

export function sharedVaultListStatusBadges(input: {
  includeInSafeToSpend?: boolean | undefined;
  isPrimary: boolean;
  showOnDashboard?: boolean | undefined;
}): SharedVaultStatusBadge[] {
  const badges: SharedVaultStatusBadge[] = [];
  if (input.includeInSafeToSpend === false) {
    badges.push({ key: "stsExcluded", label: "Safe to Spend Excluded" });
  }
  return badges;
}

export function sharedVaultsForSwitch(
  vaults: SharedVaultSummaryApi[],
  activeVaultId?: number | string | null
) {
  const filtered =
    activeVaultId != null
      ? vaults.filter((vault) => String(vault.id) !== String(activeVaultId))
      : vaults;
  return [...filtered].sort((left, right) => left.name.localeCompare(right.name));
}
