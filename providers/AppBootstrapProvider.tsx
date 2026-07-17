import { type PropsWithChildren, useEffect, useState } from "react";

import { getVaultSetupStatus } from "@/services/api/onboarding";
import { useAccessStore, type AppAccessState } from "@/stores/accessStore";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useSettingsStore } from "@/stores/settingsStore";

function getAccessState({
  authStatus,
  onboardingComplete,
  onboardingHydrated,
  setupCheckComplete,
  setupComplete,
  settingsHydrated
}: {
  authStatus: ReturnType<typeof useAuthStore.getState>["status"];
  onboardingComplete: boolean;
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

  if (!setupComplete && !onboardingComplete) {
    return "onboarding";
  }

  return "ready";
}

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const onboardingComplete = useOnboardingStore((state) => (vaultId ? state.vaults[vaultId]?.completed ?? false : false));
  const completeVault = useOnboardingStore((state) => state.completeVault);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const setAccessState = useAccessStore((state) => state.setAccessState);
  const [setupStatus, setSetupStatus] = useState<{
    checkedVaultId: string | null;
    complete: boolean;
    done: boolean;
  }>({
    checkedVaultId: null,
    complete: false,
    done: false
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

    if (authStatus !== "authenticated" || !token || !vaultId || onboardingComplete) {
      scheduleSetupStatus({
        checkedVaultId: vaultId,
        complete: onboardingComplete,
        done: true
      });
      return;
    }

    scheduleSetupStatus({
      checkedVaultId: vaultId,
      complete: false,
      done: false
    });

    getVaultSetupStatus(token)
      .then((status) => {
        if (!mounted) {
          return;
        }

        if (status.isComplete) {
          completeVault(vaultId);
        }

        setSetupStatus({
          checkedVaultId: vaultId,
          complete: status.isComplete,
          done: true
        });
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSetupStatus({
          checkedVaultId: vaultId,
          complete: false,
          done: true
        });
      });

    return () => {
      mounted = false;
    };
  }, [authStatus, completeVault, onboardingComplete, token, vaultId]);

  useEffect(() => {
    setAccessState(
      getAccessState({
        authStatus,
        onboardingComplete,
        onboardingHydrated,
        setupCheckComplete: setupStatus.done && setupStatus.checkedVaultId === vaultId,
        setupComplete: setupStatus.complete,
        settingsHydrated
      })
    );
  }, [authStatus, onboardingComplete, onboardingHydrated, setAccessState, settingsHydrated, setupStatus, vaultId]);

  return <>{children}</>;
}
