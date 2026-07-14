import { type PropsWithChildren, useEffect } from "react";

import { ApiClientError } from "@/services/api/client";
import { restoreBackendSession } from "@/services/api/session";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: PropsWithChildren) {
  const setError = useAuthStore((state) => state.setError);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setBooting = useAuthStore((state) => state.setBooting);
  const setSignedOut = useAuthStore((state) => state.setSignedOut);

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

        setAuthenticated(session.token, session.vault);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          setError(null);
        } else {
          setError("Unable to restore backend session.");
        }
        setSignedOut();
      });

    return () => {
      mounted = false;
    };
  }, [setAuthenticated, setBooting, setError, setSignedOut]);

  return <>{children}</>;
}
