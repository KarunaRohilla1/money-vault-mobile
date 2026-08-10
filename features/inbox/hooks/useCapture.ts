import { useRouter } from "expo-router";

import {
  useApproveCaptureDraftMutation,
  useCreateCaptureDraftMutation,
  useDeleteCaptureDraftMutation,
  useParseCaptureMutation
} from "@/features/inbox/api";
import { useCaptureDraftStore } from "@/features/inbox/captureDraftStore";
import {
  reviewValuesToApprovePayload,
  reviewValuesToCreatePayload,
  type ReviewFormValues
} from "@/features/inbox/inboxModel";
import { inboxRoutes } from "@/features/inbox/routes";
import type { DraftTransactionApi } from "@/services/api/types";
import { useAuthStore } from "@/stores/authStore";

export function useCapture() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const vaultId = useAuthStore((state) => state.vault?.id ?? null);
  const rawText = useCaptureDraftStore((state) => state.rawText);
  const draft = useCaptureDraftStore((state) => state.draft);
  const mode = useCaptureDraftStore((state) => state.mode);
  const setRawText = useCaptureDraftStore((state) => state.setRawText);
  const setDraft = useCaptureDraftStore((state) => state.setDraft);
  const setApproved = useCaptureDraftStore((state) => state.setApproved);
  const clearSession = useCaptureDraftStore((state) => state.clearSession);

  const parseMutation = useParseCaptureMutation(token);
  const createMutation = useCreateCaptureDraftMutation(token, vaultId);
  const approveMutation = useApproveCaptureDraftMutation(token, vaultId);
  const deleteMutation = useDeleteCaptureDraftMutation(token, vaultId);

  function startCapture(nextRawText: string) {
    const trimmed = nextRawText.trim();
    setRawText(trimmed);
    setDraft(null, "create");
    router.push(inboxRoutes.parsing);
  }

  function openDraftReview(nextDraft: DraftTransactionApi) {
    setDraft(nextDraft, "edit");
    setRawText(nextDraft.rawText);
    router.push(inboxRoutes.review);
  }

  async function parseCurrent() {
    const response = await parseMutation.mutateAsync({ rawText });
    const nextDraft = response.draftTransaction;
    setDraft(nextDraft, "create");
    return nextDraft;
  }

  async function saveToInbox(values: ReviewFormValues) {
    const response = await createMutation.mutateAsync(reviewValuesToCreatePayload(rawText, values));
    clearSession();
    return response.draftTransaction;
  }

  async function approveDraft(draftId: number, values?: ReviewFormValues) {
    const response = await approveMutation.mutateAsync({
      body: values ? reviewValuesToApprovePayload(values) : {},
      draftId
    });
    setApproved(response.transactionId, response.draftTransaction);
    return response;
  }

  async function deleteDraft(draftId: number) {
    await deleteMutation.mutateAsync(draftId);
  }

  async function approveMany(draftIds: number[]) {
    const results = [];

    for (const draftId of draftIds) {
      results.push(await approveDraft(draftId));
    }

    return results;
  }

  async function deleteMany(draftIds: number[]) {
    for (const draftId of draftIds) {
      await deleteDraft(draftId);
    }
  }

  return {
    approveDraft,
    approveMany,
    approvePending: approveMutation.isPending,
    clearSession,
    createPending: createMutation.isPending,
    deleteDraft,
    deleteMany,
    deletePending: deleteMutation.isPending,
    draft,
    mode,
    openDraftReview,
    parseCurrent,
    parseError: parseMutation.error,
    parsePending: parseMutation.isPending,
    rawText,
    saveToInbox,
    setDraft,
    setRawText,
    startCapture,
    token,
    vaultId
  };
}
