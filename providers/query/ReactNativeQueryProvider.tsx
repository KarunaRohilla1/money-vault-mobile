import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

import { queryClient } from "@/lib/queryClient";

function onAppStateChange(status: AppStateStatus): void {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export function ReactNativeQueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", onAppStateChange);

    const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => {
      appStateSubscription.remove();
      netInfoUnsubscribe();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
