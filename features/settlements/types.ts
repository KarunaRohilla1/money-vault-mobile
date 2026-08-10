import type { SharedSettlementHistoryItemApi, SharedSettlementHistoryPageApi, SharedSettlementStatus } from "@/services/api/shared.types";

export type SettlementStatus = SharedSettlementStatus;
export type SettlementDirectionFilter = "all" | "received" | "sent";
export type SettlementApi = SharedSettlementHistoryItemApi;
export type SettlementHistoryPageApi = SharedSettlementHistoryPageApi;

export interface Settlement {
  amount: number;
  createdAt: string | null;
  fromParticipantId: number;
  id: number;
  notes: string | null;
  outstandingAfter: number | null;
  outstandingBefore: number | null;
  paymentMethod: string | null;
  settledAt: string;
  status: SettlementStatus;
  toParticipantId: number;
  vaultId: number;
}

export interface CreateSettlementInput {
  amount: number;
  fromAccountId: number;
  fromParticipantId: number;
  notes?: string | null;
  paymentMethod?: string | null;
  settledAt: string;
  toAccountId: number;
  toParticipantId: number;
  vaultId: number;
}

export interface SettlementHistoryFilters {
  direction: SettlementDirectionFilter;
}

export interface SettlementListItem {
  amount: number;
  counterpartyInitials: string;
  counterpartyName: string;
  dateLabel: string;
  direction: "received" | "sent";
  id: number;
  isPartial: boolean;
  isReceived: boolean;
  monthKey: string;
  monthLabel: string;
  notes: string | null;
  outstandingAfter: number | null;
  outstandingBefore: number | null;
  paymentMethod: string | null;
  remainingBalance: number | null;
  settledAt: string;
  status: SettlementStatus;
  statusLabel: string;
  subtitle: string;
  timeLabel: string;
  title: string;
}

export interface SettlementMonthGroup {
  items: SettlementListItem[];
  key: string;
  label: string;
}

export interface SettlementDetailsViewModel {
  amount: number;
  dateLabel: string;
  fromLabel: string;
  id: number;
  isPartial: boolean;
  isReceived: boolean;
  notes: string | null;
  outstandingAfter: number | null;
  outstandingBefore: number | null;
  paymentMethod: string | null;
  statusLabel: string;
  timeLabel: string;
  title: string;
  toLabel: string;
}
