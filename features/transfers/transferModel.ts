import type { TransferApi, TransferPayloadApi } from "@/services/api/types";
import { isValidIsoDate, todayLocalIso } from "@/lib/date";

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

export type TransferFilterKey = keyof TransferFilters;
export type TransferHistoryMode = "recent" | "all";
export const RECENT_TRANSFER_LIMIT = 5;

export function emptyTransferForm(): TransferFormValues {
  return {
    amount: "",
    date: todayLocalIso(),
    fromAccountId: null,
    notes: "",
    toAccountId: null
  };
}

export function transferFormFromTransfer(transfer: TransferApi): TransferFormValues {
  return {
    amount: String(transfer.amount),
    date: transfer.date,
    fromAccountId: transfer.fromAccountId,
    notes: transfer.notes ?? "",
    toAccountId: transfer.toAccountId
  };
}

export function transferFormError(values: TransferFormValues) {
  if (!values.fromAccountId || !values.toAccountId) {
    return "Choose both accounts.";
  }

  if (values.fromAccountId === values.toAccountId) {
    return "Accounts must be different.";
  }

  const amountError = transferAmountError(values.amount);

  if (amountError) {
    return amountError;
  }

  if (!values.date.trim()) {
    return "Date is required.";
  }

  if (!isValidIsoDate(values.date.trim())) {
    return "Date must be a valid calendar date.";
  }

  return null;
}

export function transferAmountError(amountText: string) {
  if (!amountText.trim()) {
    return "Amount is required.";
  }

  const amount = Number(amountText);

  if (!Number.isFinite(amount)) {
    return "Amount must be a number.";
  }

  if (amount <= 0) {
    return "Amount must be greater than zero.";
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

export function updateTransferFilter<TFilterKey extends TransferFilterKey>(
  filters: TransferFilters,
  key: TFilterKey,
  value: TransferFilters[TFilterKey]
): TransferFilters {
  return {
    ...filters,
    [key]: value
  };
}

export function clearTransferFilter(filters: TransferFilters, key: TransferFilterKey): TransferFilters {
  return updateTransferFilter(filters, key, null);
}

export function clearTransferFilters(): TransferFilters {
  return {};
}

export function filtersKey(filters: TransferFilters = {}) {
  return JSON.stringify({
    accountId: filters.accountId ?? null,
    dateFrom: filters.dateFrom ?? null,
    dateTo: filters.dateTo ?? null
  });
}

export function transferFilterError(filters: TransferFilters) {
  if (filters.dateFrom && !isValidIsoDate(filters.dateFrom.trim())) {
    return "From date must be valid.";
  }

  if (filters.dateTo && !isValidIsoDate(filters.dateTo.trim())) {
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
