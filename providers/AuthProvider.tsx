import { type PropsWithChildren, useEffect } from "react";

import { supabase } from "@/services/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: PropsWithChildren) {
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    setStatus("loading");

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setStatus]);

  return <>{children}</>;
}
