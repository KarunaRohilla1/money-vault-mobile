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

  // App Lock never influences onboarding. Setup is Personal Vault only.
  if (!setupComplete) {
    return "onboarding";
  }

  return "ready";
}

export function AppBootstrapProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const vaultType = useAuthStore((state) => state.vault?.vaultType ?? null);
  const personalVaultId = useAuthStore((state) => state.authenticatedVault?.id ?? state.vault?.id ?? null);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const localOnboardingComplete = useOnboardingStore((state) =>
    personalVaultId ? state.vaults[personalVaultId]?.completed === true : false
  );
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

    if (authStatus !== "authenticated" || !token || !personalVaultId) {
      scheduleSetupStatus({
        checkedVaultId: personalVaultId,
        complete: false,
        done: true,
        source: "local"
      });
      return;
    }

    // Shared Vault is only reachable after Personal setup; never evaluate Shared for onboarding.
    if (vaultType === "Shared") {
      scheduleSetupStatus({
        checkedVaultId: personalVaultId,
        complete: true,
        done: true,
        source: "backend"
      });
      return;
    }

    // Local "Go to Dashboard" completion must win immediately. Re-fetching setup and
    // flipping done→false here reopens the AccessGate onboarding loop.
    if (localOnboardingComplete) {
      scheduleSetupStatus({
        checkedVaultId: personalVaultId,
        complete: true,
        done: true,
        source: "local"
      });
      return;
    }

    scheduleSetupStatus({
      checkedVaultId: personalVaultId,
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
          checkedVaultId: personalVaultId,
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
          checkedVaultId: personalVaultId,
          complete: localOnboardingComplete,
          done: true,
          source: "local"
        });
      });

    return () => {
      mounted = false;
    };
  }, [authStatus, localOnboardingComplete, personalVaultId, token, vaultType]);

  useEffect(() => {
    // Backend checklist is preferred when available, but local completion from a
    // finished onboarding flow must also admit the user. Otherwise "Go to Dashboard"
    // loops: replace("/") → AccessGate sees onboarding → /onboarding again.
    const setupComplete = setupStatus.complete || localOnboardingComplete;

    setAccessState(
      getAccessState({
        authStatus,
        onboardingHydrated,
        setupCheckComplete: setupStatus.done && setupStatus.checkedVaultId === personalVaultId,
        setupComplete,
        settingsHydrated
      })
    );
  }, [authStatus, localOnboardingComplete, onboardingHydrated, personalVaultId, setAccessState, settingsHydrated, setupStatus]);

  return <>{children}</>;
}
