import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppBootstrapProvider } from "@/providers/AppBootstrapProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { GlobalErrorBoundary } from "@/providers/GlobalErrorBoundary";
import { ReactNativeQueryProvider } from "@/providers/query/ReactNativeQueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <GlobalErrorBoundary>
        <ReactNativeQueryProvider>
          <AuthProvider>
            <AppBootstrapProvider>{children}</AppBootstrapProvider>
          </AuthProvider>
        </ReactNativeQueryProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
