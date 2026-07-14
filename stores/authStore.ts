import { create } from "zustand";

import type { AuthenticatedVault } from "@/types/domain";

type AuthStatus = "booting" | "authenticated" | "signed-out";

interface AuthState {
  errorMessage: string | null;
  token: string | null;
  status: AuthStatus;
  vault: AuthenticatedVault | null;
  setError: (message: string | null) => void;
  setAuthenticated: (token: string, vault: AuthenticatedVault | null) => void;
  setBooting: () => void;
  setSignedOut: (errorMessage?: string | null) => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  errorMessage: null,
  status: "booting",
  token: null,
  vault: null,
  setError: (errorMessage) => set({ errorMessage }),
  setAuthenticated: (token, vault) =>
    set({
      errorMessage: null,
      status: "authenticated",
      token,
      vault
    }),
  setBooting: () => set({ errorMessage: null, status: "booting" }),
  setSignedOut: (errorMessage = null) =>
    set({
      errorMessage,
      status: "signed-out",
      token: null,
      vault: null
    }),
  setStatus: (status) => set({ status })
}));
