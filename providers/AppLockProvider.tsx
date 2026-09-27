import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { AppLockOverlay } from "@/features/settings/security/components/AppLockOverlay";
import {
  getStoredAutoLockTimeout,
  isAppLockEnabled,
  shouldLockAfterBackground
} from "@/features/settings/security/services/appLock.service";
import { useAppLockStore } from "@/stores/appLockStore";
import { useAuthStore } from "@/stores/authStore";

export function AppLockProvider({ children }: PropsWithChildren) {
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.userId);
  const locked = useAppLockStore((state) => state.locked);
  const setLocked = useAppLockStore((state) => state.setLocked);
  const [hydrated, setHydrated] = useState(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const promptingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const previousAuthStatusRef = useRef<string>(authStatus);

  useEffect(() => {
    let cancelled = false;

    async function hydrateLock() {
      const prevStatus = previousAuthStatusRef.current;
      previousAuthStatusRef.current = authStatus;

      if (authStatus !== "authenticated") {
        if (!cancelled) {
          setLocked(false);
          setHydrated(true);
        }
        return;
      }

      // If user transitioned from signed-out to authenticated (fresh login/register),
      // they just signed in with their PIN. Login results in authenticated + unlocked.
      if (prevStatus === "signed-out") {
        if (!cancelled) {
          setLocked(false);
          setHydrated(true);
        }
        return;
      }

      // App Lock on cold launch session restoration is opt-in (biometric for this user).
      const enabled = await isAppLockEnabled(userId);
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
  }, [authStatus, setLocked, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previous = appStateRef.current;
      appStateRef.current = nextState;

      if (authStatus !== "authenticated" || promptingRef.current) {
        return;
      }

      void (async () => {
        const lockEnabled = await isAppLockEnabled(userId);

        if (!lockEnabled) {
          setLocked(false);
          return;
        }

        if (nextState === "background" || nextState === "inactive") {
          if (previous === "active") {
            backgroundedAtRef.current = Date.now();
          }

          const timeout = await getStoredAutoLockTimeout();
          if (shouldLockAfterBackground({ backgroundedAt: backgroundedAtRef.current, biometricEnabled: true, timeout })) {
            setLocked(true);
          }
          return;
        }

        if (nextState === "active") {
          const timeout = await getStoredAutoLockTimeout();
          if (
            shouldLockAfterBackground({
              backgroundedAt: backgroundedAtRef.current,
              biometricEnabled: true,
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
  }, [authStatus, setLocked, userId]);

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
