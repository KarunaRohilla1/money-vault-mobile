import { create } from "zustand";

interface RecoveryCodeState {
  pendingCode: string | null;
  clearPendingCode: () => void;
  setPendingCode: (code: string | null) => void;
}

/** Holds a one-time plaintext recovery code until the user confirms they saved it. */
export const useRecoveryCodeStore = create<RecoveryCodeState>((set) => ({
  pendingCode: null,
  clearPendingCode: () => set({ pendingCode: null }),
  setPendingCode: (pendingCode) => set({ pendingCode })
}));
