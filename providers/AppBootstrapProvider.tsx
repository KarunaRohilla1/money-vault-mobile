import { type PropsWithChildren, useEffect } from "react";

import { useAccessStore, type AppAccessState } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

function getAccessState({
  authStatus,
  settingsHydrated
}: {
  authStatus: ReturnType<typeof useAuthStore.getState>["status"];
  settingsHydrated: boolean;
}): AppAccessState {
  if (authStatus === "booting" || !settingsHydrated) {
    return "booting";
  }

  if (authStatus === "signed-out") {
    return "signed-out";
  }

  return "ready";
}

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const setAccessState = useAccessStore((state) => state.setAccessState);

  useEffect(() => {
    setAccessState(
      getAccessState({
        authStatus,
        settingsHydrated
      })
    );
  }, [authStatus, setAccessState, settingsHydrated]);

  return <>{children}</>;
}
