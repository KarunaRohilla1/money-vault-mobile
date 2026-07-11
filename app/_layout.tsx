import "@/global.css";
import "react-native-reanimated";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AccessGate } from "@/providers/AccessGate";
import { AppProviders } from "@/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <AccessGate />
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AppProviders>
  );
}
