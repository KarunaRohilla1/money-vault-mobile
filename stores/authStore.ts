import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  errorMessage: string | null;
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  setError: (message: string | null) => void;
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  errorMessage: null,
  session: null,
  user: null,
  status: "idle",
  setError: (errorMessage) => set({ errorMessage }),
  setSession: (session) =>
    set({
      errorMessage: null,
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "anonymous"
    }),
  setStatus: (status) => set({ status })
}));
