import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter, type Href } from "expo-router";
import { StyleSheet, type ColorValue, View } from "react-native";

import { FAB } from "@/components/ui";
import { tabs, type TabName } from "@/constants/navigation";
import { personalTabsHiddenForVault } from "@/lib/vaultNavigation";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

const tabBarStyles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.background.elevated,
    borderTopColor: theme.colors.surface.border,
    height: 76,
    paddingBottom: 14,
    paddingTop: 10
  },
  fab: {
    alignItems: "center",
    bottom: 28,
    left: 0,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0
  },
  centerSlot: {
    width: 72
  }
});

const newTransactionRoute = "/transaction/new" as Href;

function tabOptions(name: TabName, hidden = false) {
  return {
    ...(hidden ? { href: null } : {}),
    title: tabs[name].label,
    tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
      <MaterialCommunityIcons name={tabs[name].icon} color={String(color)} size={size} />
    )
  };
}

export default function TabLayout() {
  const router = useRouter();
  const activeVault = useAuthStore((state) => state.vault);
  const hidePersonalTabs = personalTabsHiddenForVault(activeVault);

  return (
    <View className="flex-1 bg-background">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.brand.soft,
          tabBarInactiveTintColor: theme.colors.text.subtle,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600"
          },
          tabBarStyle: tabBarStyles.bar
        }}
      >
        <Tabs.Screen name="index" options={tabOptions("index")} />
        <Tabs.Screen name="accounts" options={tabOptions("accounts", hidePersonalTabs)} />
        <Tabs.Screen
          name="add"
          options={{
            tabBarButton: () => <View style={tabBarStyles.centerSlot} />,
            title: ""
          }}
        />
        <Tabs.Screen name="planning" options={tabOptions("planning", hidePersonalTabs)} />
        <Tabs.Screen name="more" options={tabOptions("more")} />
      </Tabs>
      {hidePersonalTabs ? null : (
        <View pointerEvents="box-none" style={tabBarStyles.fab}>
          <FAB accessibilityLabel="Add transaction" onPress={() => router.push(newTransactionRoute)} />
        </View>
      )}
    </View>
  );
}
