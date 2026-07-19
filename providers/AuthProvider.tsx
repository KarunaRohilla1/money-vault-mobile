import { type PropsWithChildren, useEffect } from "react";

import { ApiClientError } from "@/services/api/client";
import { clearBackendSession, restoreBackendSession } from "@/services/api/session";
import { registerUnauthorizedHandler } from "@/services/api/unauthorized";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: PropsWithChildren) {
  const setError = useAuthStore((state) => state.setError);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setBooting = useAuthStore((state) => state.setBooting);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);

  useEffect(() => {
    return registerUnauthorizedHandler(async () => {
      await clearBackendSession();
      setSignedOut();
    });
  }, [setSignedOut]);

  useEffect(() => {
    let mounted = true;

    setBooting();

    restoreBackendSession()
      .then((session) => {
        if (!mounted) {
          return;
        }

        if (!session) {
          setSignedOut();
          return;
        }

        setAuthenticated(session.token, session.vault, session.authenticatedVault);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          void clearBackendSession();
          setSignedOut();
        } else {
          setSignedOut("Unable to restore backend session. Check your connection and try again.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [setAuthenticated, setBooting, setError, setSignedOut]);

  return <>{children}</>;
}
