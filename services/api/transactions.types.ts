export interface TransactionApi {
  accountName?: string | null;
  amount: number;
  categoryName: string;
  date: string;
  id: number;
  notes?: string | null;
  transactionType: string;
  transferGroupId?: string | null;
}

export type TransactionHistoryKindApi = "expense" | "income" | "transfer";
export type TransactionHistoryDirectionApi = "credit" | "debit" | "neutral";

export interface TransactionTransferMetadataApi {
  fromAccount?: string | null;
  fromRunningBalance?: number | null;
  toAccount?: string | null;
  toRunningBalance?: number | null;
}

export interface TransactionHistoryItemApi {
  account?: string | null;
  amount: number;
  category: string;
  categoryIcon: string;
  date: string;
  direction: TransactionHistoryDirectionApi;
  id: string;
  merchant?: string | null;
  runningBalance?: number | null;
  shared: boolean;
  sharedVaultName?: string | null;
  time?: string | null;
  title: string;
  transactionId?: number | null;
  transactionType: string;
  transferGroupId?: string | null;
  transferMetadata?: TransactionTransferMetadataApi | null;
  type: TransactionHistoryKindApi;
}

export interface TransactionHistorySectionApi {
  date: string;
  label: string;
  received: number;
  spent: number;
  summary: string;
  transactions: TransactionHistoryItemApi[];
}

export interface TransactionHistoryApiResponse {
  month?: string | null;
  sections: TransactionHistorySectionApi[];
  transactionCount: number;
}

export interface TransactionDetailApi {
  accountId: number;
  accountName?: string | null;
  allocationMethod?: string | null;
  amount: number;
  beneficiaryVaultId?: number | null;
  categoryId: number;
  categoryIcon?: string | null;
  categoryName?: string | null;
  createdAt?: string | null;
  date: string;
  id: number;
  notes?: string | null;
  shared?: boolean;
  sharedVaultName?: string | null;
  transactionType: string;
  transferGroupId?: string | null;
  updatedAt?: string | null;
}

export interface TransactionPayloadApi {
  accountId: number;
  allocationMethod?: string | null;
  amount: number;
  amountAllocations?: Record<string, number> | null;
  beneficiaryVaultId?: number | null;
  categoryId: number;
  date: string;
  notes?: string;
  participantVaults?: number[] | null;
  percentageAllocations?: Record<string, number> | null;
  transactionType: string;
}

export interface TransactionFiltersApi {
  account?: string;
  amountMax?: string;
  amountMin?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: string;
  search?: string;
  sharedOnly?: boolean;
  sortBy?: string;
  transactionType?: "All" | "Income" | "Expense" | "Transfer";
}

export interface TransactionMonthRangeApi {
  latestMonth: string;
  oldestMonth: string;
}
