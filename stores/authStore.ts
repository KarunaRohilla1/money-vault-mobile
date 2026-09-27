import { create } from "zustand";

import type { AuthenticatedVault } from "@/types/domain";

type AuthStatus = "booting" | "authenticated" | "signed-out";

export interface AuthSessionExtras {
  displayName?: string | null;
  pinSet?: boolean;
  userId?: string | null;
}

interface AuthState {
  authenticatedVault: AuthenticatedVault | null;
  displayName: string | null;
  errorMessage: string | null;
  pinSet: boolean;
  token: string | null;
  status: AuthStatus;
  userId: string | null;
  vault: AuthenticatedVault | null;
  setError: (message: string | null) => void;
  setAuthenticated: (
    token: string,
    vault: AuthenticatedVault | null,
    authenticatedVault?: AuthenticatedVault | null,
    extras?: AuthSessionExtras
  ) => void;
  setBooting: () => void;
  setPinSet: (pinSet: boolean) => void;
  setSignedOut: (errorMessage?: string | null) => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticatedVault: null,
  displayName: null,
  errorMessage: null,
  pinSet: false,
  status: "booting",
  token: null,
  userId: null,
  vault: null,
  setError: (errorMessage) => set({ errorMessage }),
  setAuthenticated: (token, vault, authenticatedVault = vault, extras = {}) =>
    set((state) => {
      const nextUserId = extras.userId ?? null;
      const incomingName = extras.displayName?.trim() || null;
      // Vault activate/switch responses sometimes omit displayName; keep the
      // current profile name for the same user instead of falling back to "Personal".
      const sameUser =
        state.status === "authenticated" && Boolean(nextUserId) && nextUserId === state.userId;
      const displayName = incomingName ?? (sameUser ? state.displayName : null);

      return {
        authenticatedVault,
        displayName,
        errorMessage: null,
        pinSet: extras.pinSet === true,
        status: "authenticated" as const,
        token,
        userId: nextUserId,
        vault
      };
    }),
  setBooting: () => set({ errorMessage: null, status: "booting" }),
  setPinSet: (pinSet) => set({ pinSet }),
  setSignedOut: (errorMessage = null) =>
    set({
      authenticatedVault: null,
      displayName: null,
      errorMessage,
      pinSet: false,
      status: "signed-out",
      token: null,
      userId: null,
      vault: null
    }),
  setStatus: (status) => set({ status })
}));
