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

export interface TransactionDetailApi {
  accountId: number;
  allocationMethod?: string | null;
  amount: number;
  beneficiaryVaultId?: number | null;
  categoryId: number;
  date: string;
  id: number;
  notes?: string | null;
  transactionType: string;
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
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: string;
  search?: string;
  sortBy?: string;
}
