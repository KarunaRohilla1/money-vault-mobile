import type { IconName } from "@/constants/navigation";
import type { VaultSummaryApi } from "@/services/api/types";

export type MoreRoute = `/${string}`;

export interface MoreRowModel {
  icon: IconName;
  iconTone: "brand" | "blue" | "green" | "orange" | "pink" | "muted" | "danger";
  id: string;
  action?: "in-progress" | "logout";
  route?: MoreRoute;
  title: string;
}

export const moneyRows: MoreRowModel[] = [
  { icon: "receipt-text-outline", iconTone: "brand", id: "transactions", route: "/transactions", title: "Transactions" },
  { icon: "swap-horizontal", iconTone: "blue", id: "transfers", route: "/transfers", title: "Transfers" },
  { icon: "tag-outline", iconTone: "green", id: "categories", route: "/categories", title: "Categories" },
  { icon: "chart-pie", iconTone: "blue", id: "reports", route: "/reports", title: "Reports" },
  { icon: "target", iconTone: "pink", id: "wishlist", route: "/wishlist", title: "Wishlist" }
];

export const securityRow: MoreRowModel = { icon: "lock-outline", iconTone: "brand", id: "security", route: "/settings/security", title: "Security & PIN" };
export const membersRow: MoreRowModel = { icon: "account-group-outline", iconTone: "blue", id: "members", route: "/settings/members", title: "Vault Members" };
export const notificationsRow: MoreRowModel = { icon: "bell-outline", iconTone: "green", id: "notifications", route: "/settings/notifications", title: "Notifications" };
export const sharedVaultNotificationsRow: MoreRowModel = {
  action: "in-progress",
  icon: notificationsRow.icon,
  iconTone: notificationsRow.iconTone,
  id: notificationsRow.id,
  title: notificationsRow.title
};

export const settlementHistoryRow: MoreRowModel = {
  icon: "handshake-outline",
  iconTone: "orange",
  id: "settlement-history",
  route: "/shared/settlement-history",
  title: "Settlement History"
};

const sharedVaultHiddenMoneyRowIds = new Set(["transfers", "reports"]);

export function moneyRowsForVault(vault: VaultSummaryApi | null | undefined) {
  if (!isSharedVault(vault)) {
    return moneyRows;
  }

  const rows = moneyRows
    .filter((row) => !sharedVaultHiddenMoneyRowIds.has(row.id))
    .map((row) => (row.id === "transactions" ? { ...row, route: "/shared/transactions" as const } : row));

  const transactionsIndex = rows.findIndex((row) => row.id === "transactions");
  if (transactionsIndex < 0) {
    return [settlementHistoryRow, ...rows];
  }

  return [...rows.slice(0, transactionsIndex + 1), settlementHistoryRow, ...rows.slice(transactionsIndex + 1)];
}

export const preferenceRows: MoreRowModel[] = [securityRow, membersRow, notificationsRow];

export function preferenceRowsForVault(vault: VaultSummaryApi | null | undefined) {
  const rows = [securityRow];

  if (isSharedVault(vault)) {
    rows.push(membersRow);
  }

  rows.push(isSharedVault(vault) ? sharedVaultNotificationsRow : notificationsRow);
  return rows;
}

export function preferenceRowsWithLogoutForVault(vault: VaultSummaryApi | null | undefined) {
  return [...preferenceRowsForVault(vault), logoutRow];
}

export const logoutRow: MoreRowModel = {
  action: "logout",
  icon: "logout",
  iconTone: "danger",
  id: "logout",
  title: "Logout"
};

export const preferenceRowsWithLogout: MoreRowModel[] = [...preferenceRows, logoutRow];

export function isSharedVault(vault: { vaultType: string } | null | undefined) {
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

export interface MoreMenuSection {
  id: string;
  rows: MoreRowModel[];
  title: string;
}

export function moreMenuSectionsForVault(vault: VaultSummaryApi | null | undefined): MoreMenuSection[] {
  return [
    { id: "money", rows: moneyRowsForVault(vault), title: "Money" },
    { id: "preferences", rows: preferenceRowsWithLogoutForVault(vault), title: "Vault & Preferences" }
  ];
}

export function filterMoreMenuSections(sections: MoreMenuSection[], search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return sections;
  }

  return sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => row.title.toLowerCase().includes(query) || row.id.toLowerCase().includes(query))
    }))
    .filter((section) => section.rows.length > 0);
}

export function settingsPlaceholderTitle(section: string) {
  const row = preferenceRows.find((item) => item.id === section);
  return row?.title ?? "Settings";
}