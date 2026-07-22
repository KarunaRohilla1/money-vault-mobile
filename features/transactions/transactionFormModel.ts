import { isValidIsoDate } from "@/lib/date";
import type { TransactionPayloadApi } from "@/services/api/types";

export const ALLOCATION_EQUAL = "Equal";
export const ALLOCATION_PERCENTAGE = "Percentage";
export const ALLOCATION_FIXED = "Fixed Amount";

export type TransactionKind = "Expense" | "Income";
export type ExpenseScope = "Personal" | "Shared";
export type SplitType = typeof ALLOCATION_EQUAL | typeof ALLOCATION_PERCENTAGE | typeof ALLOCATION_FIXED;

export interface SplitParticipant {
  id: number;
  isCurrent?: boolean;
  name: string;
}

export interface TransactionFormValues {
  accountId: number;
  allocationAmounts: Record<string, string>;
  allocationPercentages: Record<string, string>;
  amount: string;
  categoryId: number;
  date: string;
  expenseScope: ExpenseScope;
  notes: string;
  sharedVaultId: number;
  splitType: SplitType;
  transactionType: TransactionKind;
}

export interface SplitPreviewItem {
  amount: number;
  id: number;
  isCurrent: boolean;
  name: string;
  percentage: number;
}

export interface TransactionFormErrorMap {
  accountId?: string;
  amount?: string;
  categoryId?: string;
  date?: string;
  sharedVaultId?: string;
  split?: string;
}

export function parseTransactionAmount(value: string): number | null {
  const parsed = Number(value.replace(/,/g, "").trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function amountError(value: string): string | null {
  if (!value.trim()) {
    return "Amount is required.";
  }

  const amount = parseTransactionAmount(value);

  if (amount === null) {
    return "Amount must be a number.";
  }

  if (amount <= 0) {
    return "Amount must be greater than zero.";
  }

  return null;
}

function allocationNumber(value: string): number {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function splitPreview(amount: number, splitType: SplitType, participants: SplitParticipant[], values: TransactionFormValues) {
  if (participants.length === 0) {
    return [];
  }

  if (splitType === ALLOCATION_PERCENTAGE) {
    return participants.map((participant) => {
      const percentage = allocationNumber(values.allocationPercentages[String(participant.id)] ?? "0");
      return {
        amount: roundMoney((amount * percentage) / 100),
        id: participant.id,
        isCurrent: Boolean(participant.isCurrent),
        name: participant.name,
        percentage
      };
    });
  }

  if (splitType === ALLOCATION_FIXED) {
    return participants.map((participant) => {
      const participantAmount = allocationNumber(values.allocationAmounts[String(participant.id)] ?? "0");
      return {
        amount: roundMoney(participantAmount),
        id: participant.id,
        isCurrent: Boolean(participant.isCurrent),
        name: participant.name,
        percentage: amount > 0 ? Math.round((participantAmount / amount) * 100) : 0
      };
    });
  }

  const equalAmount = roundMoney(amount / participants.length);
  return participants.map((participant, index) => {
    const adjustedAmount = index === participants.length - 1 ? roundMoney(amount - equalAmount * (participants.length - 1)) : equalAmount;

    return {
      amount: adjustedAmount,
      id: participant.id,
      isCurrent: Boolean(participant.isCurrent),
      name: participant.name,
      percentage: Math.round(100 / participants.length)
    };
  });
}

export function transactionFormErrors(values: TransactionFormValues, participants: SplitParticipant[]): TransactionFormErrorMap {
  const errors: TransactionFormErrorMap = {};
  const parsedAmount = parseTransactionAmount(values.amount);
  const transactionAmountError = amountError(values.amount);

  if (transactionAmountError) {
    errors.amount = transactionAmountError;
  }

  if (!isValidIsoDate(values.date)) {
    errors.date = "Date must be a valid calendar date.";
  }

  if (values.accountId <= 0) {
    errors.accountId = "Choose an account.";
  }

  if (values.categoryId <= 0) {
    errors.categoryId = "Choose a category.";
  }

  const isSharedExpense = values.transactionType === "Expense" && values.expenseScope === "Shared";

  if (isSharedExpense) {
    if (values.sharedVaultId <= 0) {
      errors.sharedVaultId = "Choose a shared vault.";
    }

    if (participants.length === 0) {
      errors.split = "This shared vault has no participants.";
    }

    if (parsedAmount !== null && parsedAmount > 0 && values.splitType === ALLOCATION_PERCENTAGE) {
      const total = participants.reduce(
        (sum, participant) => sum + allocationNumber(values.allocationPercentages[String(participant.id)] ?? "0"),
        0
      );

      if (Math.abs(total - 100) > 0.01) {
        errors.split = "Split percentages must total 100%.";
      }
    }

    if (parsedAmount !== null && parsedAmount > 0 && values.splitType === ALLOCATION_FIXED) {
      const total = participants.reduce((sum, participant) => sum + allocationNumber(values.allocationAmounts[String(participant.id)] ?? "0"), 0);

      if (Math.abs(total - parsedAmount) > 0.01) {
        errors.split = "Fixed split amounts must total the transaction amount.";
      }
    }
  }

  return errors;
}

export function hasTransactionFormErrors(errors: TransactionFormErrorMap): boolean {
  return Object.values(errors).some(Boolean);
}

export function defaultSplitValues(participants: SplitParticipant[], amount: number) {
  const percentages: Record<string, string> = {};
  const amounts: Record<string, string> = {};
  const equalPercentage = participants.length > 0 ? roundMoney(100 / participants.length) : 0;
  const equalAmount = participants.length > 0 ? roundMoney(amount / participants.length) : 0;

  for (const participant of participants) {
    percentages[String(participant.id)] = String(equalPercentage);
    amounts[String(participant.id)] = String(equalAmount);
  }

  return {
    allocationAmounts: amounts,
    allocationPercentages: percentages
  };
}

function clampAllocation(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), max);
}

function formatAllocationValue(value: number): string {
  return String(roundMoney(value));
}

export function rebalanceTwoParticipantPercentages(
  participants: SplitParticipant[],
  currentValues: Record<string, string>,
  changedParticipantId: number,
  value: string
): Record<string, string> {
  const changedKey = String(changedParticipantId);
  const next = { ...currentValues, [changedKey]: value };

  if (participants.length !== 2) {
    return next;
  }

  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed)) {
    return next;
  }

  const clamped = clampAllocation(parsed, 100);
  const otherParticipant = participants.find((participant) => participant.id !== changedParticipantId);

  if (!otherParticipant) {
    return next;
  }

  return {
    ...next,
    [changedKey]: formatAllocationValue(clamped),
    [String(otherParticipant.id)]: formatAllocationValue(100 - clamped)
  };
}

export function rebalanceTwoParticipantAmounts(
  participants: SplitParticipant[],
  currentValues: Record<string, string>,
  changedParticipantId: number,
  value: string,
  transactionAmount: number
): Record<string, string> {
  const changedKey = String(changedParticipantId);
  const next = { ...currentValues, [changedKey]: value };

  if (participants.length !== 2 || transactionAmount <= 0) {
    return next;
  }

  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed)) {
    return next;
  }

  const clamped = clampAllocation(parsed, transactionAmount);
  const otherParticipant = participants.find((participant) => participant.id !== changedParticipantId);

  if (!otherParticipant) {
    return next;
  }

  return {
    ...next,
    [changedKey]: formatAllocationValue(clamped),
    [String(otherParticipant.id)]: formatAllocationValue(transactionAmount - clamped)
  };
}

export function buildTransactionPayload(
  values: TransactionFormValues,
  participants: SplitParticipant[],
  forcedSharedVaultId: number | null
): TransactionPayloadApi {
  const amount = parseTransactionAmount(values.amount) ?? 0;
  const isSharedExpense = values.transactionType === "Expense" && values.expenseScope === "Shared";
  const sharedVaultId = forcedSharedVaultId ?? values.sharedVaultId;

  const payload: TransactionPayloadApi = {
    accountId: values.accountId,
    amount,
    categoryId: values.categoryId,
    date: values.date,
    notes: values.notes.trim(),
    transactionType: values.transactionType
  };

  if (!isSharedExpense) {
    return payload;
  }

  payload.allocationMethod = values.splitType;
  payload.beneficiaryVaultId = sharedVaultId;
  payload.participantVaults = participants.map((participant) => participant.id);

  if (values.splitType === ALLOCATION_PERCENTAGE) {
    payload.percentageAllocations = Object.fromEntries(
      participants.map((participant) => [String(participant.id), allocationNumber(values.allocationPercentages[String(participant.id)] ?? "0")])
    );
  }

  if (values.splitType === ALLOCATION_FIXED) {
    payload.amountAllocations = Object.fromEntries(
      participants.map((participant) => [String(participant.id), allocationNumber(values.allocationAmounts[String(participant.id)] ?? "0")])
    );
  }

  return payload;
}
