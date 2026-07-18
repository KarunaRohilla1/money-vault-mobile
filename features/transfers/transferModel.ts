import type { TransferPayloadApi } from "@/services/api/types";

export interface TransferFormValues {
  amount: string;
  date: string;
  fromAccountId: number | null;
  notes: string;
  toAccountId: number | null;
}

export interface TransferFilters {
  accountId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export type TransferHistoryMode = "recent" | "all";
export const RECENT_TRANSFER_LIMIT = 5;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyTransferForm(): TransferFormValues {
  return {
    amount: "",
    date: todayIso(),
    fromAccountId: null,
    notes: "",
    toAccountId: null
  };
}

export function transferFormError(values: TransferFormValues) {
  if (!values.fromAccountId || !values.toAccountId) {
    return "Choose both accounts.";
  }

  if (values.fromAccountId === values.toAccountId) {
    return "Accounts must be different.";
  }

  if (!values.amount.trim()) {
    return "Amount is required.";
  }

  const amount = Number(values.amount);

  if (!Number.isFinite(amount)) {
    return "Amount must be a number.";
  }

  if (amount <= 0) {
    return "Amount must be greater than zero.";
  }

  if (!values.date.trim()) {
    return "Date is required.";
  }

  if (Number.isNaN(new Date(values.date).getTime())) {
    return "Date must be valid.";
  }

  return null;
}

export function toTransferPayload(values: TransferFormValues): TransferPayloadApi {
  return {
    amount: Number(values.amount),
    date: values.date,
    fromAccountId: values.fromAccountId ?? 0,
    notes: values.notes.trim(),
    toAccountId: values.toAccountId ?? 0
  };
}

export function filtersKey(filters: TransferFilters = {}) {
  return JSON.stringify({
    accountId: filters.accountId ?? null,
    dateFrom: filters.dateFrom ?? null,
    dateTo: filters.dateTo ?? null
  });
}

export function transferFilterError(filters: TransferFilters) {
  if (filters.dateFrom && Number.isNaN(new Date(filters.dateFrom).getTime())) {
    return "From date must be valid.";
  }

  if (filters.dateTo && Number.isNaN(new Date(filters.dateTo).getTime())) {
    return "To date must be valid.";
  }

  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return "From date cannot be after To date.";
  }

  return null;
}

export function activeTransferFilterCount(filters: TransferFilters) {
  return [filters.accountId, filters.dateFrom, filters.dateTo].filter((value) => value !== null && value !== undefined && value !== "").length;
}

export function visibleTransferHistory<T>(transfers: T[], mode: TransferHistoryMode) {
  return mode === "all" ? transfers : transfers.slice(0, RECENT_TRANSFER_LIMIT);
}
