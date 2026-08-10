import { useEffect } from "react";
import { AppState } from "react-native";

import { notificationEngine, notifyNotificationDomainChanged } from "@/features/notifications/services/notificationEngine";
import { useAuthStore } from "@/stores/authStore";

export function useNotifications() {
  const authStatus = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);

  useEffect(() => {
    if (authStatus !== "authenticated" || !token) {
      return;
    }

    void notificationEngine.initialize();
  }, [authStatus, token, vaultId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && authStatus === "authenticated") {
        notifyNotificationDomainChanged();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus]);

  return {
    reevaluate: notifyNotificationDomainChanged,
    settings: notificationEngine.getSettings()
  };
}
