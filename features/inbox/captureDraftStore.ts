import { create } from "zustand";

import type { DraftTransactionApi } from "@/services/api/types";

export type CaptureReviewMode = "create" | "edit";

interface CaptureDraftState {
  approvedDraft: DraftTransactionApi | null;
  approvedTransactionId: number | null;
  clearSession: () => void;
  draft: DraftTransactionApi | null;
  mode: CaptureReviewMode;
  rawText: string;
  setApproved: (transactionId: number, draft: DraftTransactionApi) => void;
  setDraft: (draft: DraftTransactionApi | null, mode?: CaptureReviewMode) => void;
  setRawText: (rawText: string) => void;
}

export const useCaptureDraftStore = create<CaptureDraftState>((set) => ({
  approvedDraft: null,
  approvedTransactionId: null,
  draft: null,
  mode: "create",
  rawText: "",
  clearSession: () =>
    set({
      approvedDraft: null,
      approvedTransactionId: null,
      draft: null,
      mode: "create",
      rawText: ""
    }),
  setApproved: (transactionId, draft) =>
    set({
      approvedDraft: draft,
      approvedTransactionId: transactionId
    }),
  setDraft: (draft, mode = "create") => set({ draft, mode }),
  setRawText: (rawText) => set({ rawText })
}));
