import { useMutation, useQuery } from "@tanstack/react-query";

import { adaptInboxResponse } from "@/features/inbox/inboxModel";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type {
  CaptureApproveRequestApi,
  CaptureDraftCreateRequestApi,
  CaptureParseRequestApi
} from "@/services/api/types";
import { invalidateTransactionDependents } from "@/features/transactions/api";

export function invalidateCaptureInbox(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.capture.inbox(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.capture.root });
}

export function useInboxQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => adaptInboxResponse(await apiClient.getCaptureInbox(token ?? "")),
    queryKey: queryKeys.capture.inbox(vaultId)
  });
}

export function useParseCaptureMutation(token: string | null) {
  return useMutation({
    mutationFn: async (body: CaptureParseRequestApi) => apiClient.parseCapture(token ?? "", body)
  });
}

export function useCreateCaptureDraftMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: CaptureDraftCreateRequestApi) => apiClient.createCaptureDraft(token ?? "", body),
    onSuccess: () => invalidateCaptureInbox(vaultId)
  });
}

export function useApproveCaptureDraftMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, draftId }: { body?: CaptureApproveRequestApi; draftId: number }) =>
      apiClient.approveCaptureDraft(token ?? "", draftId, body ?? {}),
    onSuccess: () => {
      invalidateCaptureInbox(vaultId);
      invalidateTransactionDependents(vaultId);
    }
  });
}

export function useDeleteCaptureDraftMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (draftId: number) => apiClient.deleteCaptureDraft(token ?? "", draftId),
    onSuccess: () => invalidateCaptureInbox(vaultId)
  });
}
