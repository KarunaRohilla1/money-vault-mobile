import type { DashboardViewModel } from "@/features/dashboard/types";
import { ApiClientError } from "@/services/api/client";

export const DASHBOARD_CONNECTION_ERROR_MESSAGE = "Couldn’t load your dashboard. Check that the server is running and try again.";

interface DashboardQuerySnapshot {
  data: DashboardViewModel | undefined;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  refetch: () => unknown;
}

export type DashboardScreenState =
  | { kind: "loading" }
  | { kind: "error"; message: string; onRetry: () => unknown }
  | { kind: "empty" }
  | { dashboard: DashboardViewModel; kind: "success" };

export function shouldClearDashboardSession(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}

export function isEmptyDashboardData(dashboard: DashboardViewModel) {
  return (
    !dashboard.setup.isComplete &&
    dashboard.setup.accounts === 0 &&
    dashboard.setup.commitments === 0 &&
    dashboard.setup.incomeTemplates === 0 &&
    dashboard.recentActivity.length === 0 &&
    dashboard.categories.length === 0
  );
}

export function getDashboardScreenState(query: DashboardQuerySnapshot): DashboardScreenState {
  if (query.isLoading) {
    return { kind: "loading" };
  }

  if (query.isError || query.error) {
    return {
      kind: "error",
      message: DASHBOARD_CONNECTION_ERROR_MESSAGE,
      onRetry: query.refetch
    };
  }

  if (!query.data) {
    return {
      kind: "error",
      message: DASHBOARD_CONNECTION_ERROR_MESSAGE,
      onRetry: query.refetch
    };
  }

  if (isEmptyDashboardData(query.data)) {
    return { kind: "empty" };
  }

  return {
    dashboard: query.data,
    kind: "success"
  };
}
