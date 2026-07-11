import { type PropsWithChildren, useEffect } from "react";

import { useAccessStore, type AppAccessState } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useVaultStore } from "@/stores/vaultStore";

function getAccessState({
  authStatus,
  currentVaultId,
  settingsHydrated,
  vaultHydrated,
  vaultUnlocked
}: {
  authStatus: ReturnType<typeof useAuthStore.getState>["status"];
  currentVaultId: ReturnType<typeof useVaultStore.getState>["currentVaultId"];
  settingsHydrated: boolean;
  vaultHydrated: boolean;
  vaultUnlocked: boolean;
}): AppAccessState {
  if (authStatus === "idle" || authStatus === "loading" || !settingsHydrated || !vaultHydrated) {
    return "booting";
  }

  if (authStatus === "anonymous") {
    return "signed-out";
  }

  if (!currentVaultId) {
    return "selecting-vault";
  }

  if (!vaultUnlocked) {
    return "vault-locked";
  }

  return "ready";
}

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const currentVaultId = useVaultStore((state) => state.currentVaultId);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const setAccessState = useAccessStore((state) => state.setAccessState);
  const vaultHydrated = useVaultStore((state) => state.hasHydrated);
  const vaultUnlocked = useAccessStore((state) => state.vaultUnlocked);

  useEffect(() => {
    setAccessState(
      getAccessState({
        authStatus,
        currentVaultId,
        settingsHydrated,
        vaultHydrated,
        vaultUnlocked
      })
    );
  }, [authStatus, currentVaultId, setAccessState, settingsHydrated, vaultHydrated, vaultUnlocked]);

  return <>{children}</>;
}
