import { formatIsoDateOnly, isValidIsoDate } from "@/lib/date";
import type {
  CreateSettlementInput,
  Settlement,
  SettlementApi,
  SettlementDetailsViewModel,
  SettlementDirectionFilter,
  SettlementHistoryFilters,
  SettlementHistoryPageApi,
  SettlementListItem,
  SettlementMonthGroup,
  SettlementStatus
} from "@/features/settlements/types";

export const SETTLEMENT_PAGE_SIZE = 20;
export const SETTLEMENT_HISTORY_PREVIEW_LIMIT = 3;

export const SETTLEMENT_DIRECTION_FILTERS: { id: SettlementDirectionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" }
];

const STATUS_LABELS: Record<SettlementStatus, string> = {
  ADJUSTMENT: "Adjustment",
  FULL: "Completed Settlement",
  PARTIAL: "Partial Settlement"
};

function parseSettledAt(value: string): Date | null {
  if (!value) {
    return null;
  }

  if (isValidIsoDate(value.slice(0, 10)) && value.length === 10) {
    return new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function settlementStatusLabel(status: SettlementStatus) {
  return STATUS_LABELS[status] ?? "Settlement";
}

export function settlementTitle(item: Pick<SettlementApi, "direction" | "fromInitials" | "toInitials">) {
  if (item.direction === "received") {
    return `${item.fromInitials} paid you`;
  }

  return `You paid ${item.toInitials}`;
}

export function mapSettlementApiToEntity(item: SettlementApi): Settlement {
  return {
    amount: item.amount,
    createdAt: item.createdAt,
    fromParticipantId: item.fromParticipantId,
    id: item.id,
    notes: item.notes,
    outstandingAfter: item.outstandingAfter,
    outstandingBefore: item.outstandingBefore,
    paymentMethod: item.paymentMethod,
    settledAt: item.settledAt,
    status: item.status,
    toParticipantId: item.toParticipantId,
    vaultId: item.vaultId
  };
}

export function formatSettlementDateLabel(settledAt: string, locale: string) {
  const date = parseSettledAt(settledAt);
  if (!date) {
    return settledAt;
  }

  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatSettlementTimeLabel(settledAt: string, locale: string) {
  const date = parseSettledAt(settledAt);
  if (!date || (isValidIsoDate(settledAt.slice(0, 10)) && settledAt.length === 10)) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatSettlementMonthKey(settledAt: string) {
  const date = parseSettledAt(settledAt);
  if (!date) {
    return "unknown";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatSettlementMonthLabel(settledAt: string, locale: string) {
  const date = parseSettledAt(settledAt);
  if (!date) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date).toUpperCase();
}

export function remainingBalanceForSettlement(item: Pick<SettlementApi, "outstandingAfter" | "status">) {
  if (item.status !== "PARTIAL") {
    return null;
  }

  if (typeof item.outstandingAfter === "number") {
    return item.outstandingAfter;
  }

  return null;
}

export function mapSettlementToListItem(item: SettlementApi, locale: string): SettlementListItem {
  const remainingBalance = remainingBalanceForSettlement(item);

  return {
    amount: item.amount,
    counterpartyInitials: item.direction === "received" ? item.fromInitials : item.toInitials,
    counterpartyName: item.direction === "received" ? item.fromName : item.toName,
    dateLabel: formatSettlementDateLabel(item.settledAt, locale),
    direction: item.direction,
    id: item.id,
    isPartial: item.status === "PARTIAL",
    isReceived: item.isReceived,
    monthKey: formatSettlementMonthKey(item.settledAt),
    monthLabel: formatSettlementMonthLabel(item.settledAt, locale),
    notes: item.notes,
    outstandingAfter: item.outstandingAfter,
    outstandingBefore: item.outstandingBefore,
    paymentMethod: item.paymentMethod,
    remainingBalance,
    settledAt: item.settledAt,
    status: item.status,
    statusLabel: settlementStatusLabel(item.status),
    subtitle: settlementStatusLabel(item.status),
    timeLabel: formatSettlementTimeLabel(item.settledAt, locale),
    title: settlementTitle(item)
  };
}

export function mapSettlementToDetails(item: SettlementListItem): SettlementDetailsViewModel {
  return {
    amount: item.amount,
    dateLabel: item.dateLabel,
    fromLabel: item.direction === "sent" ? "You" : item.counterpartyInitials,
    id: item.id,
    isPartial: item.isPartial,
    isReceived: item.isReceived,
    notes: item.notes,
    outstandingAfter: item.outstandingAfter,
    outstandingBefore: item.outstandingBefore,
    paymentMethod: item.paymentMethod,
    statusLabel: item.status === "FULL" ? "Completed" : item.status === "PARTIAL" ? "Partial" : "Adjustment",
    timeLabel: item.timeLabel,
    title: item.title,
    toLabel: item.direction === "received" ? "You" : item.counterpartyInitials
  };
}

export function groupSettlementsByMonth(items: SettlementListItem[]): SettlementMonthGroup[] {
  const groups = new Map<string, SettlementMonthGroup>();

  for (const item of items) {
    const existing = groups.get(item.monthKey);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(item.monthKey, {
      items: [item],
      key: item.monthKey,
      label: item.monthLabel
    });
  }

  return Array.from(groups.values());
}

export function settlementHistoryPreview(items: SettlementListItem[], limit = SETTLEMENT_HISTORY_PREVIEW_LIMIT) {
  return items.slice(0, limit);
}

export function sortSettlementsNewestFirst(items: SettlementApi[]) {
  return [...items].sort((left, right) => {
    const leftTime = parseSettledAt(left.settledAt)?.getTime() ?? 0;
    const rightTime = parseSettledAt(right.settledAt)?.getTime() ?? 0;
    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });
}

export function filterSettlementsByDirection(items: SettlementApi[], direction: SettlementDirectionFilter) {
  if (direction === "all") {
    return items;
  }

  return items.filter((item) => item.direction === direction);
}

export function calculateOutstandingAfter(outstandingBefore: number, amount: number) {
  return Math.max(0, Math.round((outstandingBefore - amount) * 100) / 100);
}

export function calculateSettlementStatus(outstandingBefore: number, amount: number): SettlementStatus {
  return calculateOutstandingAfter(outstandingBefore, amount) <= 0.005 ? "FULL" : "PARTIAL";
}

export function buildCreateSettlementPayload(input: CreateSettlementInput) {
  const payload: {
    amount: number;
    fromAccountId: number;
    fromVaultId: number;
    notes?: string;
    paymentMethod?: string;
    settlementDate: string;
    sharedVaultId: number;
    toAccountId: number;
    toVaultId: number;
  } = {
    amount: input.amount,
    fromAccountId: input.fromAccountId,
    fromVaultId: input.fromParticipantId,
    settlementDate: input.settledAt.slice(0, 10),
    sharedVaultId: input.vaultId,
    toAccountId: input.toAccountId,
    toVaultId: input.toParticipantId
  };

  if (input.notes) {
    payload.notes = input.notes;
  }

  if (input.paymentMethod) {
    payload.paymentMethod = input.paymentMethod;
  }

  return payload;
}

export function emptySettlementHistoryFilters(): SettlementHistoryFilters {
  return { direction: "all" };
}

export function settlementHistoryFiltersKey(filters: SettlementHistoryFilters) {
  return filters.direction;
}

export function normalizeSettlementHistoryPage(page: SettlementHistoryPageApi): SettlementHistoryPageApi {
  return {
    ...page,
    items: sortSettlementsNewestFirst(page.items ?? [])
  };
}

export function formatIsoDateFallback(value: string, locale: string) {
  if (isValidIsoDate(value.slice(0, 10))) {
    return formatIsoDateOnly(value.slice(0, 10), locale, { day: "numeric", month: "short", year: "numeric" });
  }

  return value;
}
