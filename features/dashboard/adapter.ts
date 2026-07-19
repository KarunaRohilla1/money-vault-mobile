import type { DashboardViewModel } from "@/features/dashboard/types";
import type { DashboardApiResponse } from "@/services/api/types";
import { ApiClientError } from "@/services/api/client";
import { isRecord } from "@/services/api/core";

function hasNumber(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "number" && Number.isFinite(record[key]);
}

function hasString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" && record[key].length > 0;
}

function hasBoolean(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "boolean";
}

function validateSetup(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasNumber(value, "accounts") &&
    hasNumber(value, "commitments") &&
    hasBoolean(value, "hasAccounts") &&
    hasBoolean(value, "hasCommitments") &&
    hasBoolean(value, "hasCycleSetting") &&
    hasBoolean(value, "hasIncomeTemplates") &&
    hasBoolean(value, "hasSavingsGoal") &&
    hasBoolean(value, "hasVaultLogin") &&
    hasNumber(value, "incomeTemplates") &&
    hasBoolean(value, "isComplete")
  );
}

function validateDashboardResponse(response: DashboardApiResponse) {
  if (!isRecord(response) || !isRecord(response.vault) || !isRecord(response.data) || !hasString(response, "generatedAt")) {
    throwInvalidDashboardResponse();
  }

  const { data, vault } = response;

  if (!hasString(vault, "id") || !hasString(vault, "name") || !hasString(vault, "vaultType") || !hasBoolean(vault, "isAdmin")) {
    throwInvalidDashboardResponse();
  }

  if (
    !isRecord(data.cycle) ||
    !isRecord(data.primaryAccount) ||
    !isRecord(data.settlement) ||
    !Array.isArray(data.recentActivity) ||
    !Array.isArray(data.spendingByCategory) ||
    !validateSetup(data.setup) ||
    !hasNumber(data, "creditCardDue") ||
    !hasNumber(data, "expensesThisCycle") ||
    !hasNumber(data, "remainingCommitments") ||
    !hasNumber(data, "safeToSpend") ||
    !hasString(data.cycle, "displayName") ||
    !hasNumber(data.primaryAccount, "balance") ||
    !hasString(data.primaryAccount, "name") ||
    !hasNumber(data.settlement, "amount") ||
    !hasString(data.settlement, "label")
  ) {
    throwInvalidDashboardResponse();
  }
}

function throwInvalidDashboardResponse(): never {
  throw new ApiClientError("The dashboard response was incomplete.", {
    code: "DASHBOARD_RESPONSE_INVALID",
    isNetworkError: false,
    status: null
  });
}

export function adaptDashboardResponse(response: DashboardApiResponse): DashboardViewModel {
  validateDashboardResponse(response);

  return {
    categories: response.data.spendingByCategory,
    creditCardDue: response.data.creditCardDue,
    cycle: response.data.cycle,
    cycleLabel: response.data.cycle.displayName,
    expensesThisCycle: response.data.expensesThisCycle,
    generatedAt: response.generatedAt,
    primaryAccountBalance: response.data.primaryAccount.balance,
    primaryAccountName: response.data.primaryAccount.name,
    recentActivity: response.data.recentActivity.slice(0, 5),
    remainingCommitments: response.data.remainingCommitments,
    safeToSpend: response.data.safeToSpend,
    setup: response.data.setup,
    settlement: response.data.settlement,
    summary: response.data.summary,
    vault: response.vault
  };
}
