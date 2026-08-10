import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { AppLockOverlay } from "@/features/settings/security/components/AppLockOverlay";
import {
  getStoredAutoLockTimeout,
  isBiometricUnlockEnabled,
  shouldLockAfterBackground
} from "@/features/settings/security/services/appLock.service";
import { useAppLockStore } from "@/stores/appLockStore";
import { useAuthStore } from "@/stores/authStore";

export function AppLockProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const locked = useAppLockStore((state) => state.locked);
  const setLocked = useAppLockStore((state) => state.setLocked);
  const [hydrated, setHydrated] = useState(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const promptingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let cancelled = false;

    async function hydrateLock() {
      if (authStatus !== "authenticated") {
        if (!cancelled) {
          setLocked(false);
          setHydrated(true);
        }
        return;
      }

      const enabled = await isBiometricUnlockEnabled();
      if (!cancelled) {
        setLocked(enabled);
        setHydrated(true);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(false);
    void hydrateLock();

    return () => {
      cancelled = true;
    };
  }, [authStatus, setLocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appStateRef.current;
      appStateRef.current = nextState;

      if (authStatus !== "authenticated" || promptingRef.current) {
        return;
      }

      void (async () => {
        const biometricEnabled = await isBiometricUnlockEnabled();

        if (!biometricEnabled) {
          setLocked(false);
          return;
        }

        if (nextState === "background" || nextState === "inactive") {
          if (previous === "active") {
            backgroundedAtRef.current = Date.now();
          }

          const timeout = await getStoredAutoLockTimeout();
          if (shouldLockAfterBackground({ backgroundedAt: backgroundedAtRef.current, biometricEnabled, timeout })) {
            setLocked(true);
          }
          return;
        }

        if (nextState === "active") {
          const timeout = await getStoredAutoLockTimeout();
          if (
            shouldLockAfterBackground({
              backgroundedAt: backgroundedAtRef.current,
              biometricEnabled,
              timeout
            })
          ) {
            setLocked(true);
          }
          backgroundedAtRef.current = null;
        }
      })();
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, setLocked]);

  const showLock = hydrated && authStatus === "authenticated" && locked;

  return (
    <>
      {children}
      {showLock ? (
        <AppLockOverlay
          onPromptingChange={(prompting) => {
            promptingRef.current = prompting;
          }}
          onUnlocked={() => setLocked(false)}
        />
      ) : null}
    </>
  );
}
