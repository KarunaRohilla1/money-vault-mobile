import type { IconName } from "@/constants/navigation";
import { formatIsoDateOnly, todayLocalIso } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import type {
  SharedDashboardDataApi,
  SharedDashboardParticipantApi,
  SharedDashboardRecentActivityApi,
  SharedDashboardSettlementApi,
  SharedExpenseApi,
  SharedSettlementItemApi
} from "@/services/api/types";
import type { CurrencyCode } from "@/types/domain";

export type SharedSettlementState = "payable" | "receivable" | "settled";

export interface SharedSettlementSummary {
  canRecordSettlement: boolean;
  outstandingBalance: number;
  otherParticipantName: string | null;
  payerName: string | null;
  receiverName: string | null;
  settlementState: SharedSettlementState;
  totalPaidByCurrentUser: number;
  totalPaidByOtherParticipants: number;
  totalSharedSpend: number;
}

export interface SharedParticipantViewModel {
  avatarInitial: string;
  balance: number;
  balanceLabel: string;
  displayName: string;
  isCurrentUser: boolean;
  name: string;
  paid: number;
  share: number;
  vaultId: number;
}

export interface SharedMonthlyMetrics {
  outstandingBalance: number;
  settlementsCount: number;
  sharedSpend: number;
}

export interface SharedActivityItem {
  amount: number;
  date: string;
  dateLabel: string;
  icon: IconName;
  id: number;
  paidByLabel: string;
  splitLabel: string;
  title: string;
}


const RECENT_ACTIVITY_LIMIT = 5;

function previousLocalIso(value: string) {
  const [yearText, monthText, dayText] = value.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  date.setDate(date.getDate() - 1);

  return todayLocalIso(date);
}

export function formatActivityDateLabel(date: string, locale: string) {
  const today = todayLocalIso();

  if (date === today) {
    return "Today";
  }

  if (date === previousLocalIso(today)) {
    return "Yesterday";
  }

  return formatIsoDateOnly(date, locale, { day: "numeric", month: "short" });
}

export function sharedSettlementProgressPercent(paid: number, share: number): number {
  if (share <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((paid / share) * 100)));
}

function activeSettlementItem(items: SharedSettlementItemApi[]) {
  return items.find((item) => item.amount > 0) ?? null;
}

function settlementCounterparty(item: SharedSettlementItemApi | null, state: SharedSettlementState) {
  if (!item) {
    return null;
  }

  if (state === "payable") {
    return item.to_name;
  }

  if (state === "receivable") {
    return item.from_name;
  }

  return item.counterparty_name;
}

function otherParticipantsPaid(participants: SharedDashboardParticipantApi[]) {
  return participants.filter((participant) => !participant.isCurrentUser).reduce((sum, participant) => sum + participant.paid, 0);
}

function firstOtherParticipantName(participants: SharedDashboardParticipantApi[], fallback: string | null) {
  const other = participants.find((participant) => !participant.isCurrentUser);
  return other?.name ?? fallback;
}

export function buildSettlementSummary(
  settlement: SharedDashboardSettlementApi,
  participants: SharedDashboardParticipantApi[],
  quickActions: SharedDashboardDataApi["quickActions"],
  totalSharedSpend: number
): SharedSettlementSummary {
  const state = settlement.amount <= 0 ? "settled" : settlement.direction;
  const settlementItem = activeSettlementItem(settlement.items);
  const counterpartyName = settlementCounterparty(settlementItem, state);
  const otherParticipantName = firstOtherParticipantName(participants, counterpartyName);
  const currentUser = participants.find((participant) => participant.isCurrentUser);
  const totalPaidByCurrentUser = currentUser?.paid ?? settlement.currentUserPaid;
  const totalPaidByOtherParticipants = otherParticipantsPaid(participants);

  if (state === "settled") {
    return {
      canRecordSettlement: false,
      outstandingBalance: 0,
      otherParticipantName,
      payerName: null,
      receiverName: null,
      settlementState: "settled",
      totalPaidByCurrentUser,
      totalPaidByOtherParticipants,
      totalSharedSpend
    };
  }

  if (state === "payable") {
    return {
      canRecordSettlement: quickActions.markSettledEnabled,
      outstandingBalance: settlement.amount,
      otherParticipantName,
      payerName: "You",
      receiverName: counterpartyName,
      settlementState: "payable",
      totalPaidByCurrentUser,
      totalPaidByOtherParticipants,
      totalSharedSpend
    };
  }

  return {
    canRecordSettlement: quickActions.markSettledEnabled,
    outstandingBalance: settlement.amount,
    otherParticipantName,
    payerName: counterpartyName,
    receiverName: "You",
    settlementState: "receivable",
    totalPaidByCurrentUser,
    totalPaidByOtherParticipants,
    totalSharedSpend
  };
}

export function buildParticipantBalanceLabel(
  participant: SharedDashboardParticipantApi,
  currencyCode: CurrencyCode,
  locale: string
) {
  const formattedAmount = formatCurrency(Math.abs(participant.balance), currencyCode, locale);

  if (participant.balance < 0) {
    return participant.isCurrentUser ? `You owe ${formattedAmount}` : `${participant.name} owes ${formattedAmount}`;
  }

  if (participant.balance > 0) {
    return participant.isCurrentUser ? `You get ${formattedAmount}` : `${participant.name} gets ${formattedAmount}`;
  }

  return "Settled";
}

export function buildParticipants(
  participants: SharedDashboardParticipantApi[],
  currencyCode: CurrencyCode,
  locale: string
): SharedParticipantViewModel[] {
  return participants.map((participant) => ({
    avatarInitial: participant.avatarInitial,
    balance: participant.balance,
    balanceLabel: buildParticipantBalanceLabel(participant, currencyCode, locale),
    displayName: participant.isCurrentUser ? "You" : participant.name,
    isCurrentUser: participant.isCurrentUser,
    name: participant.name,
    paid: participant.paid,
    share: participant.share,
    vaultId: participant.vaultId
  }));
}

export function buildMonthlyMetrics(dashboard: SharedDashboardDataApi): SharedMonthlyMetrics {
  return {
    outstandingBalance: dashboard.settlement.amount,
    settlementsCount: 0,
    sharedSpend: dashboard.householdSnapshot.householdSpendThisMonth
  };
}

const MATERIAL_COMMUNITY_ICON_PATTERN = /^[a-z0-9-]+$/;

function isMaterialCommunityIconName(icon: string): icon is IconName {
  return MATERIAL_COMMUNITY_ICON_PATTERN.test(icon);
}

export function resolveSharedActivityIcon(icon: string | null | undefined, category: string): IconName {
  const normalized = (icon ?? "").trim();

  if (normalized.length > 0 && isMaterialCommunityIconName(normalized)) {
    return normalized;
  }

  const categoryText = category.toLowerCase();

  if (categoryText.includes("food") || categoryText.includes("dining") || categoryText.includes("coffee") || categoryText.includes("cafe")) {
    return "silverware-fork-knife";
  }

  if (categoryText.includes("transport") || categoryText.includes("travel") || categoryText.includes("fuel")) {
    return "car-outline";
  }

  if (categoryText.includes("home") || categoryText.includes("rent") || categoryText.includes("utilities")) {
    return "home-outline";
  }

  return "receipt-text-outline";
}

function mapExpenseToActivity(expense: SharedExpenseApi, locale: string): SharedActivityItem {
  return {
    amount: expense.amount,
    date: expense.date,
    dateLabel: formatActivityDateLabel(expense.date, locale),
    icon: resolveSharedActivityIcon(expense.category_icon, expense.category),
    id: expense.id,
    paidByLabel: `Paid by ${expense.paid_by}`,
    splitLabel: expense.split_label,
    title: expense.merchant || expense.category
  };
}

function mapDashboardActivityToItem(item: SharedDashboardRecentActivityApi, locale: string): SharedActivityItem {
  return {
    amount: item.amount,
    date: item.date,
    dateLabel: formatActivityDateLabel(item.date, locale),
    icon: resolveSharedActivityIcon(item.icon, item.category),
    id: item.id,
    paidByLabel: `Paid by ${item.participant}`,
    splitLabel: item.sharedTag,
    title: item.category
  };
}

export function buildRecentActivity(
  expenses: SharedExpenseApi[] | undefined,
  dashboardActivity: SharedDashboardRecentActivityApi[] | undefined,
  locale: string
) {
  const source = expenses && expenses.length > 0 ? expenses.map((expense) => mapExpenseToActivity(expense, locale)) : (dashboardActivity ?? []).map((item) => mapDashboardActivityToItem(item, locale));

  return source.slice(0, RECENT_ACTIVITY_LIMIT);
}
