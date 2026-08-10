import { request } from "@/services/api/core";
import type {
  CaptureApproveRequestApi,
  CaptureApproveResponseApi,
  CaptureDraftCreateRequestApi,
  CaptureDraftResponseApi,
  CaptureInboxResponseApi,
  CaptureParseRequestApi,
  CaptureParseResponseApi,
  SuccessApiResponse
} from "@/services/api/types";

export function parseCapture(token: string, body: CaptureParseRequestApi) {
  return request<CaptureParseResponseApi, CaptureParseRequestApi>({
    body,
    method: "POST",
    path: "/api/capture/parse",
    token
  });
}

export function createCaptureDraft(token: string, body: CaptureDraftCreateRequestApi) {
  return request<CaptureDraftResponseApi, CaptureDraftCreateRequestApi>({
    body,
    method: "POST",
    path: "/api/capture/drafts",
    token
  });
}

export function getCaptureInbox(token: string) {
  return request<CaptureInboxResponseApi>({
    path: "/api/capture/inbox",
    token
  });
}

export function approveCaptureDraft(token: string, draftId: number, body: CaptureApproveRequestApi = {}) {
  return request<CaptureApproveResponseApi, CaptureApproveRequestApi>({
    body,
    method: "POST",
    path: `/api/capture/drafts/${draftId}/approve`,
    token
  });
}

export function deleteCaptureDraft(token: string, draftId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/capture/drafts/${draftId}`,
    token
  });
}
