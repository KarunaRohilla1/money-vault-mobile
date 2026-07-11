import { type PropsWithChildren, useEffect } from "react";

import { supabase } from "@/services/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: PropsWithChildren) {
  const setError = useAuthStore((state) => state.setError);
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    let mounted = true;

    setStatus("loading");

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) {
          return;
        }

        if (error) {
          setError(error.message);
          setSession(null);
          return;
        }

        setSession(data.session);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setError(error instanceof Error ? error.message : "Unable to restore authentication session.");
        setSession(null);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setError(null);
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setError, setSession, setStatus]);

  return <>{children}</>;
}
