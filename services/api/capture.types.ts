export type DraftStatusApi = "NEEDS_REVIEW" | "READY_TO_APPROVE" | "FAILED" | "DELETED" | "APPROVED";

export interface DraftConfidenceApi {
  fields?: Record<string, number>;
  overall: number;
}

export interface DraftTransactionApi {
  accountId?: number | null;
  accountName?: string | null;
  amount?: number | null;
  approvedAt?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  confidence: DraftConfidenceApi;
  createdAt?: string | null;
  currency?: string;
  date?: string | null;
  duplicate?: boolean;
  existingTransactionId?: number | null;
  id?: number | null;
  merchant?: string | null;
  notes?: string | null;
  rawText: string;
  status: DraftStatusApi | string;
  transactionType?: string | null;
  updatedAt?: string | null;
  vaultId: number;
}

export interface CaptureParseRequestApi {
  rawText: string;
  source?: string;
}

export interface CaptureParseResponseApi {
  draftTransaction: DraftTransactionApi;
}

export interface CaptureDraftCreateRequestApi {
  accountId?: number | null;
  accountName?: string | null;
  amount?: number | null;
  categoryId?: number | null;
  categoryName?: string | null;
  currency?: string | null;
  date?: string | null;
  merchant?: string | null;
  notes?: string | null;
  rawText: string;
  source?: string;
  transactionType?: string | null;
}

export interface CaptureDraftResponseApi {
  draftTransaction: DraftTransactionApi;
}

export interface CaptureInboxResponseApi {
  failed: DraftTransactionApi[];
  needsReview: DraftTransactionApi[];
  ready: DraftTransactionApi[];
}

export interface CaptureApproveRequestApi {
  accountId?: number | null;
  amount?: number | null;
  categoryId?: number | null;
  date?: string | null;
  merchant?: string | null;
  notes?: string | null;
  transactionType?: string | null;
}

export interface CaptureApproveResponseApi {
  draftTransaction: DraftTransactionApi;
  transactionId: number;
}
