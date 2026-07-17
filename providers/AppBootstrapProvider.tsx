import { type PropsWithChildren, useEffect, useState } from "react";

import { getVaultSetupStatus } from "@/services/api/onboarding";
import { useAccessStore, type AppAccessState } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSettingsStore } from "@/stores/settingsStore";

function getAccessState({
  authStatus,
  onboardingHydrated,
  setupCheckComplete,
  setupComplete,
  settingsHydrated
}: {
  authStatus: ReturnType<typeof useAuthStore.getState>["status"];
  onboardingHydrated: boolean;
  setupCheckComplete: boolean;
  setupComplete: boolean;
  settingsHydrated: boolean;
}): AppAccessState {
  if (authStatus === "booting" || !settingsHydrated || !onboardingHydrated || !setupCheckComplete) {
    return "booting";
  }

  if (authStatus === "signed-out") {
    return "signed-out";
  }

  if (!setupComplete) {
    return "onboarding";
  }

  return "ready";
}

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const localOnboardingComplete = useOnboardingStore((state) => (vaultId ? state.vaults[vaultId]?.completed === true : false));
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const setAccessState = useAccessStore((state) => state.setAccessState);
  const [setupStatus, setSetupStatus] = useState<{
    checkedVaultId: string | null;
    complete: boolean;
    done: boolean;
    source: "backend" | "local";
  }>({
    checkedVaultId: null,
    complete: false,
    done: false,
    source: "local"
  });

  useEffect(() => {
    let mounted = true;
    const scheduleSetupStatus = (status: typeof setupStatus) => {
      void Promise.resolve().then(() => {
        if (mounted) {
          setSetupStatus(status);
        }
      });
    };

    if (authStatus !== "authenticated" || !token || !vaultId) {
      scheduleSetupStatus({
        checkedVaultId: vaultId,
        complete: false,
        done: true,
        source: "local"
      });
      return;
    }

    scheduleSetupStatus({
      checkedVaultId: vaultId,
      complete: false,
      done: false,
      source: "backend"
    });

    getVaultSetupStatus(token)
      .then((status) => {
        if (!mounted) {
          return;
        }

        setSetupStatus({
          checkedVaultId: vaultId,
          complete: status.isComplete,
          done: true,
          source: "backend"
        });
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSetupStatus({
          checkedVaultId: vaultId,
          complete: localOnboardingComplete,
          done: true,
          source: "local"
        });
      });

    return () => {
      mounted = false;
    };
  }, [authStatus, localOnboardingComplete, token, vaultId]);

  useEffect(() => {
    setAccessState(
      getAccessState({
        authStatus,
        onboardingHydrated,
        setupCheckComplete: setupStatus.done && setupStatus.checkedVaultId === vaultId,
        setupComplete: setupStatus.source === "backend" ? setupStatus.complete : localOnboardingComplete,
        settingsHydrated
      })
    );
  }, [authStatus, localOnboardingComplete, onboardingHydrated, setAccessState, settingsHydrated, setupStatus, vaultId]);

  return <>{children}</>;
}
