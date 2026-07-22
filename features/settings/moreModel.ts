import type { IconName } from "@/constants/navigation";
import type { VaultSummaryApi } from "@/services/api/types";

export type MoreRoute = `/${string}`;

export interface MoreRowModel {
  icon: IconName;
  iconTone: "brand" | "blue" | "green" | "orange" | "pink" | "muted";
  id: string;
  route: MoreRoute;
  title: string;
}

export const moneyRows: MoreRowModel[] = [
  { icon: "receipt-text-outline", iconTone: "brand", id: "transactions", route: "/transactions", title: "Transactions" },
  { icon: "swap-horizontal", iconTone: "blue", id: "transfers", route: "/transfers", title: "Transfers" },
  { icon: "tag-outline", iconTone: "green", id: "categories", route: "/categories", title: "Categories" },
  { icon: "chart-pie", iconTone: "blue", id: "reports", route: "/reports", title: "Reports" },
  { icon: "target", iconTone: "pink", id: "wishlist", route: "/wishlist", title: "Wishlist" }
];

export const preferenceRows: MoreRowModel[] = [
  { icon: "lock-outline", iconTone: "brand", id: "security", route: "/settings/security", title: "Security & PIN" },
  { icon: "account-group-outline", iconTone: "blue", id: "members", route: "/settings/members", title: "Vault Members" },
  { icon: "bell-outline", iconTone: "green", id: "notifications", route: "/settings/notifications", title: "Notifications" },
  { icon: "cloud-upload-outline", iconTone: "orange", id: "backup", route: "/settings/backup", title: "Data & Backup" },
  { icon: "palette-outline", iconTone: "brand", id: "appearance", route: "/settings/appearance", title: "Appearance" },
  { icon: "information-outline", iconTone: "muted", id: "about", route: "/settings/about", title: "About Money Vault" }
];

export function isSharedVault(vault: VaultSummaryApi | null | undefined) {
  return vault?.vaultType === "Shared";
}

export function personalVaultFor(currentVault: VaultSummaryApi, accessibleVaults: VaultSummaryApi[]) {
  if (!isSharedVault(currentVault)) {
    return currentVault;
  }

  return accessibleVaults.find((vault) => !isSharedVault(vault)) ?? null;
}

export function firstSharedVault(accessibleVaults: VaultSummaryApi[]) {
  return accessibleVaults.find(isSharedVault) ?? null;
}

export function switchTarget(currentVault: VaultSummaryApi, accessibleVaults: VaultSummaryApi[]) {
  return isSharedVault(currentVault) ? personalVaultFor(currentVault, accessibleVaults) : firstSharedVault(accessibleVaults);
}

export function roleLabel(vault: { isAdmin: boolean } | null | undefined) {
  return vault?.isAdmin ? "Admin" : "Member";
}

export function settingsPlaceholderTitle(section: string) {
  const row = preferenceRows.find((item) => item.id === section);
  return row?.title ?? "Settings";
}
