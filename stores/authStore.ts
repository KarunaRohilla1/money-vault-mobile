import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  status: "idle",
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "anonymous"
    }),
  setStatus: (status) => set({ status })
}));
