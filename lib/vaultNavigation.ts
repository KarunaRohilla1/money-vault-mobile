import type { AuthenticatedVault } from "@/types/domain";

export type MoreActionId =
  | "transactions"
  | "transfers"
  | "categories"
  | "shared"
  | "shared-expenses"
  | "bills"
  | "reports"
  | "wishlist"
  | "settings";

export function isSharedVault(vault: AuthenticatedVault | null): boolean {
  return vault?.vaultType === "Shared";
}

export function personalTabsHiddenForVault(vault: AuthenticatedVault | null): boolean {
  return isSharedVault(vault);
}

export function moreActionsForVault(vault: AuthenticatedVault | null): MoreActionId[] {
  if (isSharedVault(vault)) {
    return ["shared-expenses", "bills", "settings"];
  }

  return ["transactions", "transfers", "categories", "shared", "reports", "wishlist", "settings"];
}
