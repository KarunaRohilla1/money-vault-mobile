import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppBootstrapProvider } from "@/providers/AppBootstrapProvider";
import { AppLockProvider } from "@/providers/AppLockProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { GlobalErrorBoundary } from "@/providers/GlobalErrorBoundary";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { ReactNativeQueryProvider } from "@/providers/query/ReactNativeQueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <GlobalErrorBoundary>
        <ReactNativeQueryProvider>
          <AuthProvider>
            <AppBootstrapProvider>
              <AppLockProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </AppLockProvider>
            </AppBootstrapProvider>
          </AuthProvider>
        </ReactNativeQueryProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
