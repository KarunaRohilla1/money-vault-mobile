import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FAB } from "@/components/ui";
import { appShellMetrics, bottomNavItems, shouldShowBottomPanel, type BottomNavItem } from "@/lib/appShell";
import { personalTabsHiddenForVault } from "@/lib/vaultNavigation";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

const newTransactionRoute = "/transaction/new";

const styles = StyleSheet.create({
  centerSlot: {
    width: 72
  },
  fab: {
    alignItems: "center",
    left: 0,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0,
    top: -32
  },
  panel: {
    backgroundColor: theme.colors.background.elevated,
    borderTopColor: theme.colors.surface.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingTop: 10
  },
  slot: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    justifyContent: "center"
  },
  hiddenSlot: {
    opacity: 0
  }
});

interface AppShellProps {
  children: ReactNode;
}

function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const activeVault = useAuthStore((state) => state.vault);
  const insets = useSafeAreaInsets();
  const items = bottomNavItems(pathname, activeVault);
  const metrics = appShellMetrics(insets.bottom, true);
  const hidePersonalTabs = personalTabsHiddenForVault(activeVault);
  const renderItem = (item: BottomNavItem) => (
    <Pressable
      key={item.name}
      accessibilityLabel={item.label}
      accessibilityRole="button"
      disabled={item.hidden}
      onPress={() => router.push(item.route)}
      style={[styles.slot, item.hidden ? styles.hiddenSlot : null]}
    >
      <MaterialCommunityIcons name={item.icon} size={22} color={item.active ? theme.colors.brand.soft : theme.colors.text.subtle} />
      <Text className="font-sans text-xs font-semibold" style={{ color: item.active ? theme.colors.brand.soft : theme.colors.text.subtle }}>
        {item.label}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.panel, { height: metrics.tabBarHeight, paddingBottom: metrics.tabBarPaddingBottom }]}>
      {items.slice(0, 2).map(renderItem)}
      <View pointerEvents="none" style={styles.centerSlot} />
      {items.slice(2).map(renderItem)}
      {hidePersonalTabs ? null : (
        <View pointerEvents="box-none" style={styles.fab}>
          <FAB accessibilityLabel="Add transaction" onPress={() => router.push(newTransactionRoute)} />
        </View>
      )}
    </View>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPanelVisible = shouldShowBottomPanel(pathname);
  const metrics = appShellMetrics(insets.bottom, bottomPanelVisible);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 bg-background" style={{ paddingBottom: metrics.contentPaddingBottom }}>
        {children}
      </View>
      {bottomPanelVisible ? <BottomNavigation /> : null}
    </View>
  );
}
