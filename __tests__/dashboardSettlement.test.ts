import {
  buildSettlementPayload,
  firstOutstandingSettlementItem,
  firstSettlementAccountId,
  hasOutstandingSettlement,
  INVALID_SETTLEMENT_ACCOUNT_MESSAGE,
  INVALID_SETTLEMENT_AMOUNT_MESSAGE,
  NO_SETTLEMENT_MESSAGE,
  settlementAccountError,
  settlementItemLabel
} from "@/features/dashboard/settlement";
import type { SharedSettlementItemApi } from "@/services/api/types";

const settlementItem: SharedSettlementItemApi = {
  amount: 42,
  counterparty_name: "Sam",
  counterparty_vault_id: 2,
  direction: "payable",
  from_accounts: [{ balance: 120, id: 10, is_primary: true, name: "Everyday", type: "Checking" }],
  from_name: "Alex",
  from_vault_id: 1,
  label: "You Owe:",
  shared_vault_id: 9,
  shared_vault_name: "House",
  to_accounts: [{ balance: 50, id: 20, is_primary: true, name: "Shared", type: "Savings" }],
  to_name: "Sam",
  to_vault_id: 2
};

describe("dashboard settlement helpers", () => {
  it("shows the action only for positive unsettled settlement summaries", () => {
    expect(hasOutstandingSettlement({ amount: 0, direction: "settled" })).toBe(false);
    expect(hasOutstandingSettlement({ amount: 25, direction: "payable" })).toBe(true);
    expect(hasOutstandingSettlement({ amount: 25, direction: "receivable" })).toBe(true);
  });

  it("selects the first positive settlement item", () => {
    expect(firstOutstandingSettlementItem([{ ...settlementItem, amount: 0 }, settlementItem])).toBe(settlementItem);
    expect(firstOutstandingSettlementItem([{ ...settlementItem, amount: 0 }])).toBeNull();
  });

  it("uses the first active settlement account returned by the backend", () => {
    expect(firstSettlementAccountId(settlementItem.from_accounts)).toBe(10);
    expect(firstSettlementAccountId([])).toBeNull();
  });

  it("keeps legacy account validation messages", () => {
    expect(settlementAccountError({ ...settlementItem, from_accounts: [] })).toBe("Alex has no active account to pay from.");
    expect(settlementAccountError({ ...settlementItem, to_accounts: [] })).toBe("Sam has no active account to receive into.");
    expect(settlementAccountError(settlementItem)).toBeNull();
  });

  it("formats the legacy settlement picker label", () => {
    expect(settlementItemLabel(settlementItem, "$42")).toBe("Alex pays Sam $42 · House");
  });

  it("builds the exact shared settlement payload expected by the API", () => {
    expect(
      buildSettlementPayload({
        amount: 42,
        fromAccountId: 10,
        item: settlementItem,
        settlementDate: "2026-07-22",
        toAccountId: 20
      })
    ).toEqual({
      amount: 42,
      fromAccountId: 10,
      fromVaultId: 1,
      settlementDate: "2026-07-22",
      sharedVaultId: 9,
      toAccountId: 20,
      toVaultId: 2
    });
  });

  it("rejects missing settlement items", () => {
    expect(() =>
      buildSettlementPayload({
        amount: 42,
        fromAccountId: 10,
        item: null,
        settlementDate: "2026-07-22",
        toAccountId: 20
      })
    ).toThrow(NO_SETTLEMENT_MESSAGE);
  });

  it("rejects zero and negative settlement amounts with the legacy message", () => {
    for (const amount of [0, -1]) {
      expect(() =>
        buildSettlementPayload({
          amount,
          fromAccountId: 10,
          item: settlementItem,
          settlementDate: "2026-07-22",
          toAccountId: 20
        })
      ).toThrow(INVALID_SETTLEMENT_AMOUNT_MESSAGE);
    }
  });

  it("rejects missing account ids with the legacy API message", () => {
    expect(() =>
      buildSettlementPayload({
        amount: 42,
        fromAccountId: null,
        item: settlementItem,
        settlementDate: "2026-07-22",
        toAccountId: 20
      })
    ).toThrow(INVALID_SETTLEMENT_ACCOUNT_MESSAGE);
  });
});
