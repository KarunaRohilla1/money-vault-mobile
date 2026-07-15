import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/services/api/client";
import type { PlanningItemPayloadApi, PlanningStatusPayloadApi } from "@/services/api/types";

function invalidatePlanningDependents(vaultId: string | null) {
  queryClient.invalidateQueries({ queryKey: queryKeys.planning.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.current(vaultId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.root });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root });
}

export function usePlanningQuery(token: string | null, vaultId: string | null) {
  return useQuery({
    enabled: Boolean(token && vaultId),
    queryFn: async () => apiClient.getPlanning(token ?? ""),
    queryKey: queryKeys.planning.current(vaultId)
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

export function useCreateIncomeTemplateMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async (body: PlanningItemPayloadApi) => apiClient.createIncomeTemplate(token ?? "", body),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}

export function useCloseActiveCycleMutation(token: string | null, vaultId: string | null) {
  return useMutation({
    mutationFn: async () => apiClient.closeActivePlanningCycle(token ?? ""),
    onSuccess: () => invalidatePlanningDependents(vaultId)
  });
}
