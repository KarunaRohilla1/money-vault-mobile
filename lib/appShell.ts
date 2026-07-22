import type { Href } from "expo-router";

import { tabs, type IconName, type TabName } from "@/constants/navigation";
import { bottomTabMetrics } from "@/lib/bottomTabMetrics";
import { personalTabsHiddenForVault } from "@/lib/vaultNavigation";
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

const tabOrder: TabName[] = ["index", "accounts", "planning", "more"];

export function shouldShowBottomPanel(pathname: string) {
  return pathname !== "/more" && pathname !== "/onboarding";
}

export function activeBottomTab(pathname: string): TabName | null {
  if (pathname === "/") {
    return "index";
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

  return tabOrder.map((name) => ({
    active: activeTab === name,
    hidden: hidePersonalTabs && (name === "accounts" || name === "planning"),
    icon: tabs[name].icon,
    label: tabs[name].label,
    name,
    route: tabRoutes[name]
  }));
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
