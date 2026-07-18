export interface TransferApi {
  amount: number;
  date: string;
  fromAccountId: number;
  fromAccountName: string;
  notes?: string | null;
  toAccountId: number;
  toAccountName: string;
  transferGroupId: string;
}

export interface TransferDetailApi {
  amount: number;
  date: string;
  fromAccountId: number;
  notes?: string | null;
  toAccountId: number;
  transferGroupId: string;
  vaultId: number;
}

export interface TransferPayloadApi {
  amount: number;
  date: string;
  fromAccountId: number;
  notes?: string;
  toAccountId: number;
}

export interface TransferFiltersApi {
  accountId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}
