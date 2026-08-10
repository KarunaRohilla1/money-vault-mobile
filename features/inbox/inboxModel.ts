import type { DraftStatusApi, DraftTransactionApi } from "@/services/api/types";

export type InboxSectionKey = "needsReview" | "ready" | "failed";

export type StatusBadgeTone = "success" | "warning" | "danger";

export interface InboxViewModel {
  failed: DraftTransactionApi[];
  needsReview: DraftTransactionApi[];
  pendingCount: number;
  ready: DraftTransactionApi[];
  totalCount: number;
}

export interface ReviewFormValues {
  accountId: number | null;
  accountName: string;
  amount: string;
  categoryId: number | null;
  categoryName: string;
  date: string;
  merchant: string;
  notes: string;
  transactionType: string;
}

export const INBOX_COPY = {
  approvedMessage: "Transaction approved! Moved to your transactions.",
  approvedTitle: "Approved",
  captureManual: "Type or paste manually.",
  capturePaste: "Paste from Clipboard",
  capturePlaceholder: "Type or paste your transaction message here...",
  captureSubtitle: "Type or paste a bank/SMS message.",
  captureTitle: "Capture Transaction",
  deleteSelected: "Delete Selected",
  duplicateBody: "We found a similar transaction. This transaction already exists in your records.",
  duplicateCancel: "Cancel",
  duplicateImport: "Import Anyway",
  duplicateTitle: "Possible Duplicate",
  emptyMessage: "Paste a bank SMS, UPI alert, or receipt to get started.",
  emptyTitle: "Inbox is empty",
  needsAttentionAction: "Review",
  needsAttentionSingular: "1 transaction waiting for review.",
  parsingFooter: "Parsing usually takes 2-3 seconds.",
  readyApproveAll: "Approve All",
  saveToInbox: "Save to Inbox",
  screenSubtitle: "Capture. Review. Approve.",
  screenTitle: "Inbox",
  sectionFailed: "Failed",
  sectionNeedsReview: "Needs Review",
  sectionReady: "Ready to Approve",
  supportedTypes: ["SMS", "UPI", "Bank Alerts", "Email receipts", "Credit Card alerts"] as const
} as const;

export const READY_CONFIDENCE_DISPLAY = 95;

export function inboxPendingCount(inbox: Pick<InboxViewModel, "failed" | "needsReview" | "ready">) {
  return inbox.needsReview.length + inbox.ready.length + inbox.failed.length;
}

export function adaptInboxResponse(response: {
  failed: DraftTransactionApi[];
  needsReview: DraftTransactionApi[];
  ready: DraftTransactionApi[];
}): InboxViewModel {
  const needsReview = response.needsReview ?? [];
  const ready = response.ready ?? [];
  const failed = response.failed ?? [];
  const pendingCount = needsReview.length + ready.length + failed.length;

  return {
    failed,
    needsReview,
    pendingCount,
    ready,
    totalCount: pendingCount
  };
}

export function draftOverallConfidence(draft: DraftTransactionApi) {
  const overall = draft.confidence?.overall;
  return typeof overall === "number" && Number.isFinite(overall) ? Math.round(overall) : 0;
}

export function draftFieldConfidence(draft: DraftTransactionApi, field: string) {
  const value = draft.confidence?.fields?.[field];
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

export function normalizeDraftStatus(status: string): DraftStatusApi | string {
  return status;
}

export function isReadyDraft(draft: DraftTransactionApi) {
  return draft.status === "READY_TO_APPROVE";
}

export function isFailedDraft(draft: DraftTransactionApi) {
  return draft.status === "FAILED";
}

export function isNeedsReviewDraft(draft: DraftTransactionApi) {
  return draft.status === "NEEDS_REVIEW";
}

export function statusBadgeTone(draft: DraftTransactionApi): StatusBadgeTone {
  if (isReadyDraft(draft)) {
    return "success";
  }

  if (isFailedDraft(draft)) {
    return "danger";
  }

  return "warning";
}

export function statusBadgeLabel(draft: DraftTransactionApi) {
  if (isReadyDraft(draft)) {
    return "Ready to approve";
  }

  if (isFailedDraft(draft)) {
    return "Could not extract";
  }

  if (!draft.categoryId && !draft.categoryName) {
    return "Missing Category";
  }

  if (!draft.accountId) {
    return "Needs Account";
  }

  if (!draft.merchant) {
    return "Missing Merchant";
  }

  if (!draft.amount) {
    return "Missing Amount";
  }

  return "Needs Review";
}

export function needsAttentionMessage(count: number) {
  if (count === 1) {
    return INBOX_COPY.needsAttentionSingular;
  }

  return `${count} transactions waiting for review.`;
}

export function draftToReviewValues(draft: DraftTransactionApi): ReviewFormValues {
  return {
    accountId: draft.accountId ?? null,
    accountName: draft.accountName ?? "",
    amount: draft.amount != null ? String(draft.amount) : "",
    categoryId: draft.categoryId ?? null,
    categoryName: draft.categoryName ?? "",
    date: draft.date ?? "",
    merchant: draft.merchant ?? "",
    notes: draft.notes ?? draft.rawText ?? "",
    transactionType: draft.transactionType ?? "Expense"
  };
}

export function reviewValuesToCreatePayload(rawText: string, values: ReviewFormValues) {
  const amount = Number(values.amount.replace(/,/g, "").trim());

  return {
    accountId: values.accountId,
    accountName: values.accountName || null,
    amount: Number.isFinite(amount) && values.amount.trim() ? amount : null,
    categoryId: values.categoryId,
    categoryName: values.categoryName || null,
    date: values.date || null,
    merchant: values.merchant || null,
    notes: values.notes || null,
    rawText,
    transactionType: values.transactionType || null
  };
}

export function reviewValuesToApprovePayload(values: ReviewFormValues) {
  const amount = Number(values.amount.replace(/,/g, "").trim());

  return {
    accountId: values.accountId,
    amount: Number.isFinite(amount) && values.amount.trim() ? amount : null,
    categoryId: values.categoryId,
    date: values.date || null,
    merchant: values.merchant || null,
    notes: values.notes || null,
    transactionType: values.transactionType || null
  };
}

export function formatDraftDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    hour: value.includes("T") ? "numeric" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
    month: "short",
    year: "numeric"
  }).format(date);
}

export function merchantInitials(merchant: string | null | undefined) {
  const cleaned = (merchant ?? "").trim();

  if (!cleaned) {
    return "?";
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export function parsingChecklist(draft: DraftTransactionApi | null) {
  return [
    { done: Boolean(draft?.amount != null), key: "amount", label: "Found amount" },
    { done: Boolean(draft?.merchant), key: "merchant", label: "Found merchant" },
    { done: Boolean(draft?.date), key: "date", label: "Found date" },
    { done: Boolean(draft?.accountId || draft?.accountName), key: "account", label: "Found account" },
    { done: Boolean(draft?.categoryId || draft?.categoryName), key: "category", label: "Finding category" }
  ] as const;
}
