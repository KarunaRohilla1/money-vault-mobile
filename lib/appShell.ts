import type { Href } from "expo-router";

import { tabs, type IconName, type TabName } from "@/constants/navigation";
import { sharedRoutes } from "@/features/shared/routes";
import { bottomTabMetrics } from "@/lib/bottomTabMetrics";
import { isSharedVault, personalTabsHiddenForVault } from "@/lib/vaultNavigation";
import type { AuthenticatedVault } from "@/types/domain";

export interface BottomNavItem {
  active: boolean;
  hidden: boolean;
  icon: IconName;
  label: string;
  name: TabName;
  route: Href;
}

const tabRoutes: Record<TabName, Href> = {
  accounts: "/accounts",
  index: "/",
  more: "/more",
  planning: "/planning"
};

const sharedTransactionsRoute: Href = sharedRoutes.transactions;
const sharedSettlementHistoryRoute: Href = sharedRoutes.settlementHistory;
const tabOrder: TabName[] = ["index", "accounts", "planning", "more"];

export function shouldShowBottomPanel(pathname: string) {
  return pathname !== "/more" && pathname !== "/onboarding";
}

export function activeBottomTab(pathname: string): TabName | null {
  if (pathname === "/") {
    return "index";
  }

  if (pathname.startsWith("/shared/settlement-history")) {
    return "planning";
  }

  if (pathname.startsWith("/shared/transactions")) {
    return "accounts";
  }

  if (pathname.startsWith("/accounts")) {
    return "accounts";
  }

  if (pathname.startsWith("/planning")) {
    return "planning";
  }

  if (pathname.startsWith("/more")) {
    return "more";
  }

  return null;
}

export function bottomNavItems(pathname: string, vault: AuthenticatedVault | null): BottomNavItem[] {
  const activeTab = activeBottomTab(pathname);
  const hidePersonalTabs = personalTabsHiddenForVault(vault);
  const sharedVault = isSharedVault(vault);

  return tabOrder.map((name) => {
    const sharedTransactionsTab = sharedVault && name === "accounts";
    const sharedSettlementHistoryTab = sharedVault && name === "planning";

    return {
      active: sharedSettlementHistoryTab
        ? pathname.startsWith("/shared/settlement-history")
        : sharedTransactionsTab
          ? pathname.startsWith("/shared/transactions")
          : activeTab === name,
      hidden: hidePersonalTabs && name === "planning" && !sharedVault,
      icon: sharedSettlementHistoryTab
        ? "handshake-outline"
        : sharedTransactionsTab
          ? "receipt-text-outline"
          : tabs[name].icon,
      label: sharedSettlementHistoryTab ? "Settlements" : sharedTransactionsTab ? "Transactions" : tabs[name].label,
      name,
      route: sharedSettlementHistoryTab
        ? sharedSettlementHistoryRoute
        : sharedTransactionsTab
          ? sharedTransactionsRoute
          : tabRoutes[name]
    };
  });
}

export function appShellMetrics(bottomInset: number, bottomPanelVisible: boolean) {
  const metrics = bottomTabMetrics(bottomInset);
  const safeBottom = Math.max(0, bottomInset);

  return {
    ...metrics,
    contentPaddingBottom: bottomPanelVisible ? 0 : safeBottom,
    panelHeight: bottomPanelVisible ? metrics.tabBarHeight : 0
  };
}
