import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { PlanningClosePayloadApi, PlanningItemPayloadApi, PlanningStatusPayloadApi } from "@/services/api/types";

function invalidatePlanningDependents(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.planning.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
}

export function usePlanningQuery(token: string | null, vaultId: string | null, cycleStart?: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getPlanning(token ?? "", cycleStart ? { cycleStart } : {}),
    queryKey: queryKeys.planning.detail(vaultId, cycleStart)
  });
}

export function usePlanningCyclesQuery(token: string | null, vaultId: string | null, year?: number | null, status = "all", enabled = true) {
  return useQuery({
    enabled: Boolean(enabled && token && vaultId && year),
    queryFn: async () => apiClient.getPlanningCycles(token ?? "", year ? { status, year } : { status }),
    queryKey: queryKeys.planning.cycles(vaultId, year, status)
  });
}

export function useSetCommitmentStatusMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ commitmentId, body }: { body: PlanningStatusPayloadApi; commitmentId: number }) =>
      apiClient.setCommitmentStatus(token ?? "", commitmentId, body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useSetIncomeStatusMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, templateId }: { body: PlanningStatusPayloadApi; templateId: number }) =>
      apiClient.setIncomeStatus(token ?? "", templateId, body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useCreateCommitmentMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: PlanningItemPayloadApi) => apiClient.createCommitment(token ?? "", body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useUpdateCommitmentMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, commitmentId }: { body: PlanningItemPayloadApi; commitmentId: number }) =>
      apiClient.updateCommitment(token ?? "", commitmentId, body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useDeleteCommitmentMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (commitmentId: number) => apiClient.deleteCommitment(token ?? "", commitmentId),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useCreateIncomeTemplateMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: PlanningItemPayloadApi) => apiClient.createIncomeTemplate(token ?? "", body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useUpdateIncomeTemplateMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, templateId }: { body: PlanningItemPayloadApi; templateId: number }) =>
      apiClient.updateIncomeTemplate(token ?? "", templateId, body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useDeleteIncomeTemplateMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (templateId: number) => apiClient.deleteIncomeTemplate(token ?? "", templateId),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useCloseActiveCycleMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async ({ body, cycleStart }: { body?: PlanningClosePayloadApi; cycleStart?: string }) =>
      apiClient.closeActivePlanningCycle(token ?? "", cycleStart, body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}
