import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type TabName = "index" | "accounts" | "planning" | "more";
export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export const tabs: Record<TabName, { label: string; icon: IconName }> = {
  index: { label: "Dashboard", icon: "view-dashboard-outline" },
  accounts: { label: "Accounts", icon: "wallet-outline" },
  planning: { label: "Planning", icon: "chart-timeline-variant" },
  more: { label: "More", icon: "dots-horizontal-circle-outline" }
};
