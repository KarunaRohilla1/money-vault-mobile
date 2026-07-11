import { QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/providers/AuthProvider";
import { queryClient } from "@/lib/queryClient";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
