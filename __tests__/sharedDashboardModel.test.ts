import {
  buildParticipantBalanceLabel,
  buildParticipants,
  buildRecentActivity,
  buildSettlementSummary,
  formatActivityDateLabel,
  sharedSettlementProgressPercent
} from "@/features/shared/sharedDashboardModel";
import { todayLocalIso } from "@/lib/date";
import type { SharedDashboardDataApi, SharedDashboardParticipantApi, SharedExpenseApi } from "@/services/api/types";

function previousIso(value: string) {
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return todayLocalIso(date);
}

const participantA: SharedDashboardParticipantApi = {
  avatarInitial: "Y",
  balance: -1250,
  isCurrentUser: true,
  name: "You",
  negativeBalance: 1250,
  paid: 13650,
  positiveBalance: 0,
  share: 12400,
  vaultId: 1
};

const participantB: SharedDashboardParticipantApi = {
  avatarInitial: "A",
  balance: 1250,
  isCurrentUser: false,
  name: "Aman",
  negativeBalance: 0,
  paid: 10590,
  positiveBalance: 1250,
  share: 11840,
  vaultId: 2
};

const dashboardFixture: SharedDashboardDataApi = {
  cycle: {
    daysCompleted: 10,
    daysRemaining: 21,
    displayName: "July Cycle",
    endDate: "2026-07-31",
    id: 1,
    progressPercent: 32,
    startDate: "2026-07-01",
    status: "Current",
    totalDays: 31
  },
  emptyStates: {
    noBills: false,
    noCategories: false,
    noParticipants: false,
    noSharedTransactions: false,
    noSpending: false
  },
  householdSnapshot: {
    householdSpendThisMonth: 18240,
    participantCount: 2,
    topCategory: "Food",
    topCategoryAmount: 1200,
    topCategoryPercentage: 60,
    upcomingBillsCount: 0
  },
  monthlySummary: {
    dailyAverage: 200,
    monthlySpend: 18240,
    projection: 6200
  },
  participants: [participantA, participantB],
  quickActions: {
    canAddBill: true,
    canAddExpense: true,
    canSplit: true,
    markSettledEnabled: true,
    markSettledVisible: true
  },
  recentActivity: [],
  settlement: {
    amount: 1250,
    currentUserIsOwed: 0,
    currentUserOwes: 1250,
    currentUserPaid: 13650,
    currentUserShare: 12400,
    direction: "payable",
    items: [
      {
        amount: 1250,
        counterparty_name: "Aman",
        counterparty_vault_id: 2,
        direction: "payable",
        from_accounts: [],
        from_name: "You",
        from_vault_id: 1,
        label: "You owe",
        shared_vault_id: 9,
        shared_vault_name: "Home",
        to_accounts: [],
        to_name: "Aman",
        to_vault_id: 2
      }
    ],
    label: "You owe",
    settlementPercentage: 110
  },
  spendingChart: []
};

const expenseFixture: SharedExpenseApi = {
  allocation_method: "Equal",
  amount: 450,
  category: "Dining",
  category_icon: "silverware-fork-knife",
  category_id: 1,
  date: "2026-08-08",
  id: 42,
  merchant: "Dinner at Blue Tokai",
  my_share: 225,
  notes: "",
  other_share: 225,
  paid_by: "You",
  paid_by_id: 1,
  settlement_amount: 0,
  settlement_label: "Settled",
  settlement_tone: "neutral",
  split_label: "Split 50/50"
};

describe("sharedDashboardModel", () => {
  it("returns the paid-to-share ratio as a capped percentage", () => {
    expect(sharedSettlementProgressPercent(1200, 1000)).toBe(100);
    expect(sharedSettlementProgressPercent(300, 1000)).toBe(30);
  });

  it("returns zero when there is no share to compare against", () => {
    expect(sharedSettlementProgressPercent(0, 0)).toBe(0);
    expect(sharedSettlementProgressPercent(500, 0)).toBe(0);
  });

  it("builds payable settlement summary with counterparty context", () => {
    const summary = buildSettlementSummary(
      dashboardFixture.settlement,
      dashboardFixture.participants,
      dashboardFixture.quickActions,
      dashboardFixture.householdSnapshot.householdSpendThisMonth
    );

    expect(summary).toMatchObject({
      settlementState: "payable",
      outstandingBalance: 1250,
      payerName: "You",
      receiverName: "Aman",
      otherParticipantName: "Aman",
      canRecordSettlement: true,
      totalPaidByCurrentUser: 13650,
      totalPaidByOtherParticipants: 10590,
      totalSharedSpend: 18240
    });
  });

  it("builds settled summary when no outstanding balance remains", () => {
    const summary = buildSettlementSummary(
      {
        ...dashboardFixture.settlement,
        amount: 0,
        direction: "settled",
        items: []
      },
      dashboardFixture.participants,
      dashboardFixture.quickActions,
      dashboardFixture.householdSnapshot.householdSpendThisMonth
    );

    expect(summary).toMatchObject({
      settlementState: "settled",
      outstandingBalance: 0,
      payerName: null,
      receiverName: null,
      canRecordSettlement: false,
      totalSharedSpend: 18240
    });
  });

  it("builds receivable settlement summary when the counterparty owes you", () => {
    const summary = buildSettlementSummary(
      {
        ...dashboardFixture.settlement,
        amount: 50,
        currentUserIsOwed: 50,
        currentUserOwes: 0,
        direction: "receivable",
        items: [
          {
            amount: 50,
            counterparty_name: "AS",
            counterparty_vault_id: 2,
            direction: "receivable",
            from_accounts: [],
            from_name: "AS",
            from_vault_id: 2,
            label: "AS owes",
            shared_vault_id: 9,
            shared_vault_name: "Home",
            to_accounts: [],
            to_name: "You",
            to_vault_id: 1
          }
        ],
        label: "AS owes you"
      },
      [
        { ...participantA, balance: 50, negativeBalance: 0, paid: 100, positiveBalance: 50, share: 50 },
        { ...participantB, balance: -50, name: "AS", negativeBalance: 50, paid: 0, positiveBalance: 0, share: 50 }
      ],
      dashboardFixture.quickActions,
      100
    );

    expect(summary).toMatchObject({
      settlementState: "receivable",
      outstandingBalance: 50,
      payerName: "AS",
      receiverName: "You",
      totalPaidByCurrentUser: 100,
      totalPaidByOtherParticipants: 0,
      totalSharedSpend: 100,
      canRecordSettlement: true
    });
  });

  it("formats participant balance labels for current and other users", () => {
    expect(buildParticipantBalanceLabel(participantA, "INR", "en-IN")).toContain("You owe");
    expect(buildParticipantBalanceLabel(participantB, "INR", "en-IN")).toContain("Aman gets");
  });

  it("maps shared expenses into recent activity rows", () => {
    const activity = buildRecentActivity([expenseFixture], dashboardFixture.recentActivity, "en-IN");

    expect(activity).toHaveLength(1);
    expect(activity[0]).toMatchObject({
      title: "Dinner at Blue Tokai",
      paidByLabel: "Paid by You",
      splitLabel: "Split 50/50"
    });
  });

  it("falls back when category icons are emojis or invalid names", () => {
    const activity = buildRecentActivity(
      [
        {
          ...expenseFixture,
          category: "Coffee",
          category_icon: "☕"
        }
      ],
      dashboardFixture.recentActivity,
      "en-IN"
    );

    expect(activity[0]?.icon).toBe("silverware-fork-knife");
  });

  it("formats relative activity dates", () => {
    const today = todayLocalIso();

    expect(formatActivityDateLabel(today, "en-IN")).toBe("Today");
    expect(formatActivityDateLabel(previousIso(today), "en-IN")).toBe("Yesterday");
  });

  it("builds participant view models", () => {
    const participants = buildParticipants(dashboardFixture.participants, "INR", "en-IN");

    expect(participants[0]?.displayName).toBe("You");
    expect(participants[1]?.displayName).toBe("Aman");
  });
});
