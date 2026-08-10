import {
  calculateOutstandingAfter,
  calculateSettlementStatus,
  filterSettlementsByDirection,
  formatSettlementMonthKey,
  groupSettlementsByMonth,
  mapSettlementToListItem,
  settlementHistoryPreview,
  settlementStatusLabel,
  settlementTitle,
  sortSettlementsNewestFirst
} from "@/features/settlements/settlementModel";
import type { SettlementApi } from "@/features/settlements/types";

const sampleReceived: SettlementApi = {
  amount: 1250,
  createdAt: "2026-08-05T14:00:00+00:00",
  direction: "received",
  fromInitials: "AS",
  fromName: "Aman Singh",
  fromParticipantId: 2,
  id: 1,
  isReceived: true,
  notes: "Dinner, Groceries",
  outstandingAfter: 0,
  outstandingBefore: 1250,
  paymentMethod: "UPI Transfer",
  settledAt: "2026-08-05T14:00:00+00:00",
  status: "FULL",
  toInitials: "YO",
  toName: "You",
  toParticipantId: 1,
  vaultId: 10
};

const samplePartial: SettlementApi = {
  amount: 500,
  createdAt: "2026-08-02T14:45:00+00:00",
  direction: "sent",
  fromInitials: "YO",
  fromName: "You",
  fromParticipantId: 1,
  id: 2,
  isReceived: false,
  notes: null,
  outstandingAfter: 750,
  outstandingBefore: 1250,
  paymentMethod: "UPI Transfer",
  settledAt: "2026-08-02T14:45:00+00:00",
  status: "PARTIAL",
  toInitials: "AS",
  toName: "Aman Singh",
  toParticipantId: 2,
  vaultId: 10
};

describe("settlementModel", () => {
  it("builds titles for received and sent settlements", () => {
    expect(settlementTitle(sampleReceived)).toBe("AS paid you");
    expect(settlementTitle(samplePartial)).toBe("You paid AS");
  });

  it("maps status labels", () => {
    expect(settlementStatusLabel("FULL")).toBe("Completed Settlement");
    expect(settlementStatusLabel("PARTIAL")).toBe("Partial Settlement");
  });

  it("calculates outstanding after and status", () => {
    expect(calculateOutstandingAfter(1250, 500)).toBe(750);
    expect(calculateSettlementStatus(1250, 500)).toBe("PARTIAL");
    expect(calculateSettlementStatus(1250, 1250)).toBe("FULL");
  });

  it("filters by direction and sorts newest first", () => {
    const sorted = sortSettlementsNewestFirst([samplePartial, sampleReceived]);
    expect(sorted.map((item) => item.id)).toEqual([1, 2]);
    expect(filterSettlementsByDirection(sorted, "received")).toHaveLength(1);
    expect(filterSettlementsByDirection(sorted, "sent")).toHaveLength(1);
  });

  it("groups by month and previews latest three", () => {
    const items = [sampleReceived, samplePartial].map((item) => mapSettlementToListItem(item, "en-IN"));
    expect(formatSettlementMonthKey(sampleReceived.settledAt)).toBe("2026-08");
    const groups = groupSettlementsByMonth(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toContain("2026");
    expect(settlementHistoryPreview(items, 1)).toHaveLength(1);
  });
});
