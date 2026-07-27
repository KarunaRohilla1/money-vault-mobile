import { buildQuery, request } from "@/services/api/core";
import type {
  PlanningApiResponse,
  PlanningClosePayloadApi,
  PlanningItemPayloadApi,
  PlanningStatusPayloadApi,
  SuccessApiResponse
} from "@/services/api/types";

export function getPlanning(token: string, params: { cycleStart?: string } = {}) {
  return request<PlanningApiResponse>({
    path: `/api/planning${buildQuery([["cycleStart", params.cycleStart]])}`,
    token
  });
}

export function getPlanningCycles(token: string, params: { status?: string; year?: number } = {}) {
  return request<PlanningApiResponse["cycleNavigation"]>({
    path: `/api/planning/cycles${buildQuery([["year", params.year], ["status", params.status]])}`,
    token
  });
}

export function createCommitment(token: string, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "POST",
    path: "/api/planning/commitments",
    token
  });
}

export function updateCommitment(token: string, commitmentId: number, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "PUT",
    path: `/api/planning/commitments/${commitmentId}`,
    token
  });
}

export function deleteCommitment(token: string, commitmentId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/planning/commitments/${commitmentId}`,
    token
  });
}

export function setCommitmentStatus(token: string, commitmentId: number, body: PlanningStatusPayloadApi) {
  return request<SuccessApiResponse, PlanningStatusPayloadApi>({
    body,
    method: "POST",
    path: `/api/planning/commitments/${commitmentId}/status`,
    token
  });
}

export function createIncomeTemplate(token: string, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "POST",
    path: "/api/planning/income-templates",
    token
  });
}

export function updateIncomeTemplate(token: string, templateId: number, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "PUT",
    path: `/api/planning/income-templates/${templateId}`,
    token
  });
}

export function deleteIncomeTemplate(token: string, templateId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/planning/income-templates/${templateId}`,
    token
  });
}

export function setIncomeStatus(token: string, templateId: number, body: PlanningStatusPayloadApi) {
  return request<SuccessApiResponse, PlanningStatusPayloadApi>({
    body,
    method: "POST",
    path: `/api/planning/income-templates/${templateId}/status`,
    token
  });
}

export function closeActivePlanningCycle(token: string, cycleStart?: string, body?: PlanningClosePayloadApi) {
  const path = cycleStart ? `/api/planning/cycles/${encodeURIComponent(cycleStart)}/close` : "/api/planning/cycles/close-active";

  return request<PlanningApiResponse["cycle"], PlanningClosePayloadApi>({
    ...(body ? { body } : {}),
    method: "POST",
    path,
    token
  });
}
