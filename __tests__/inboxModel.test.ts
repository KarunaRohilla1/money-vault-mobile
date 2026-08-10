import {
  adaptInboxResponse,
  draftOverallConfidence,
  draftToReviewValues,
  inboxPendingCount,
  merchantInitials,
  needsAttentionMessage,
  reviewValuesToApprovePayload,
  reviewValuesToCreatePayload,
  statusBadgeLabel,
  statusBadgeTone
} from "@/features/inbox/inboxModel";
import type { DraftTransactionApi } from "@/services/api/types";

function draft(overrides: Partial<DraftTransactionApi> = {}): DraftTransactionApi {
  return {
    confidence: { fields: { amount: 100, category: 80 }, overall: 88 },
    rawText: "HDFC Bank: Rs.450.00 debited",
    status: "NEEDS_REVIEW",
    vaultId: 4,
    ...overrides
  };
}

describe("inboxModel", () => {
  it("adapts inbox buckets and pending counts", () => {
    const inbox = adaptInboxResponse({
      failed: [draft({ id: 3, status: "FAILED" })],
      needsReview: [draft({ id: 1 }), draft({ id: 2 })],
      ready: [draft({ id: 4, status: "READY_TO_APPROVE" })]
    });

    expect(inbox.pendingCount).toBe(4);
    expect(inboxPendingCount(inbox)).toBe(4);
    expect(needsAttentionMessage(1)).toBe("1 transaction waiting for review.");
    expect(needsAttentionMessage(3)).toBe("3 transactions waiting for review.");
  });

  it("derives status badge labels from missing fields", () => {
    expect(statusBadgeLabel(draft({ status: "READY_TO_APPROVE" }))).toBe("Ready to approve");
    expect(statusBadgeTone(draft({ status: "READY_TO_APPROVE" }))).toBe("success");
    expect(statusBadgeLabel(draft({ status: "FAILED" }))).toBe("Could not extract");
    expect(statusBadgeTone(draft({ status: "FAILED" }))).toBe("danger");
    expect(statusBadgeLabel(draft({ categoryId: null, categoryName: null }))).toBe("Missing Category");
    expect(statusBadgeLabel(draft({ accountId: null, categoryId: 2, categoryName: "Food" }))).toBe("Needs Account");
  });

  it("maps review form values to create and approve payloads", () => {
    const values = draftToReviewValues(
      draft({
        accountId: 1,
        accountName: "HDFC",
        amount: 245,
        categoryId: 7,
        categoryName: "Cafe",
        date: "2026-08-08",
        merchant: "Third Wave Coffee",
        notes: "Original SMS",
        transactionType: "Expense"
      })
    );

    expect(values.amount).toBe("245");
    expect(draftOverallConfidence(draft({ confidence: { overall: 95.4 } }))).toBe(95);
    expect(merchantInitials("Third Wave Coffee")).toBe("TW");

    expect(reviewValuesToCreatePayload("raw", values)).toMatchObject({
      accountId: 1,
      amount: 245,
      categoryId: 7,
      merchant: "Third Wave Coffee",
      rawText: "raw"
    });

    expect(reviewValuesToApprovePayload(values)).toMatchObject({
      accountId: 1,
      amount: 245,
      categoryId: 7,
      merchant: "Third Wave Coffee"
    });
  });
});
