import type { IconName } from "@/constants/navigation";
import { formatActivityDateLabel } from "@/features/shared/sharedDashboardModel";
import {
  ALLOCATION_EQUAL,
  ALLOCATION_FIXED,
  ALLOCATION_PERCENTAGE,
  type TransactionFormValues
} from "@/features/transactions/transactionFormModel";
import type { SharedExpenseApi, SharedExpenseShareApi, SharedParticipantTupleApi } from "@/services/api/types";

export interface SharedTransactionListItem {
  amount: number;
  date: string;
  dateLabel: string;
  icon: IconName;
  id: number;
  paidByLabel: string;
  splitLabel: string;
  title: string;
}

export interface SharedTransactionSection {
  data: SharedTransactionListItem[];
  date: string;
  label: string;
}

function mapExpenseToListItem(expense: SharedExpenseApi, locale: string, resolveIcon: (icon: string | null | undefined, category: string) => IconName): SharedTransactionListItem {
  return {
    amount: expense.amount,
    date: expense.date,
    dateLabel: formatActivityDateLabel(expense.date, locale),
    icon: resolveIcon(expense.category_icon, expense.category),
    id: expense.id,
    paidByLabel: `Paid by ${expense.paid_by}`,
    splitLabel: expense.split_label,
    title: expense.merchant || expense.category
  };
}

export function filterSharedExpenses(expenses: SharedExpenseApi[], search: string) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return expenses;
  }

  return expenses.filter((expense) =>
    [expense.merchant, expense.category, expense.paid_by, expense.split_label, expense.notes].some((field) => field.toLowerCase().includes(query))
  );
}

export function groupSharedExpenses(
  expenses: SharedExpenseApi[],
  locale: string,
  resolveIcon: (icon: string | null | undefined, category: string) => IconName
): SharedTransactionSection[] {
  const grouped = new Map<string, SharedTransactionListItem[]>();

  for (const expense of [...expenses].sort((left, right) => right.date.localeCompare(left.date))) {
    const items = grouped.get(expense.date) ?? [];
    items.push(mapExpenseToListItem(expense, locale, resolveIcon));
    grouped.set(expense.date, items);
  }

  return Array.from(grouped.entries()).map(([date, data]) => ({
    data,
    date,
    label: formatActivityDateLabel(date, locale)
  }));
}

export function findSharedExpenseById(expenses: SharedExpenseApi[], transactionId: number) {
  return expenses.find((expense) => expense.id === transactionId) ?? null;
}

export function canManageSharedExpense(expense: SharedExpenseApi, participantVaultId: number | null) {
  return participantVaultId !== null && expense.paid_by_id === participantVaultId;
}

function normalizeAllocationMethod(value: string): TransactionFormValues["splitType"] {
  if (value === ALLOCATION_PERCENTAGE || value === ALLOCATION_FIXED) {
    return value;
  }

  return ALLOCATION_EQUAL;
}

export function resolveSharedExpenseShares(
  expense: SharedExpenseApi,
  participants: SharedParticipantTupleApi[],
  currentParticipantId: number | null
): SharedExpenseShareApi[] {
  if (expense.shares?.length) {
    return expense.shares;
  }

  if (participants.length === 0 || currentParticipantId === null) {
    return [];
  }

  if (participants.length === 2) {
    const otherParticipant = participants.find((participant) => participant[0] !== currentParticipantId);

    if (!otherParticipant) {
      return [];
    }

    const amount = expense.amount;

    return [
      {
        amount: expense.my_share,
        participant_id: currentParticipantId,
        percentage: amount > 0 ? Math.round((expense.my_share / amount) * 10000) / 100 : 0
      },
      {
        amount: expense.other_share,
        participant_id: otherParticipant[0],
        percentage: amount > 0 ? Math.round((expense.other_share / amount) * 10000) / 100 : 0
      }
    ];
  }

  const equalAmount = participants.length > 0 ? Math.round((expense.amount / participants.length) * 100) / 100 : 0;

  return participants.map((participant, index) => {
    const amount = index === participants.length - 1 ? expense.amount - equalAmount * (participants.length - 1) : equalAmount;

    return {
      amount,
      participant_id: participant[0],
      percentage: expense.amount > 0 ? Math.round((amount / expense.amount) * 10000) / 100 : 0
    };
  });
}

export function mapSharedExpenseToFormValues(
  expense: SharedExpenseApi,
  sharedVaultId: number,
  participants: SharedParticipantTupleApi[],
  currentParticipantId: number | null,
  accountId = 0
): TransactionFormValues {
  const shares = resolveSharedExpenseShares(expense, participants, currentParticipantId);
  const allocationAmounts: Record<string, string> = {};
  const allocationPercentages: Record<string, string> = {};

  for (const share of shares) {
    allocationAmounts[String(share.participant_id)] = String(share.amount);
    allocationPercentages[String(share.participant_id)] = String(share.percentage);
  }

  return {
    accountId: expense.account_id ?? accountId,
    allocationAmounts,
    allocationPercentages,
    amount: String(expense.amount),
    categoryId: expense.category_id,
    date: expense.date,
    expenseScope: "Shared",
    notes: expense.notes ?? "",
    sharedVaultId,
    splitType: normalizeAllocationMethod(expense.allocation_method),
    transactionType: "Expense"
  };
}
