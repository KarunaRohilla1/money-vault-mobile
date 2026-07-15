import type { AuthenticatedVault, JsonObject } from "@/types/domain";

export interface LoginRequest {
  pin: string;
  vaultName: string;
}

export interface LoginResponse {
  expiresAt?: string;
  token: string;
  vault: AuthenticatedVault;
}

export interface FinancialCycleApi {
  daysCompleted: number;
  daysRemaining: number;
  displayName: string;
  endDate: string;
  id: number;
  progressPercent: number;
  startDate: string;
  status: string;
  totalDays: number;
}

export interface PrimaryAccountApi {
  balance: number;
  name: string;
}

export interface SettlementApi {
  amount: number;
  direction: string;
  items: JsonObject[];
  label: string;
  net: number;
  payable: number;
  receivable: number;
}

export interface RecentActivityApi {
  accountName?: string | null;
  amount: number;
  categoryName: string;
  date: string;
  id: number;
  notes?: string | null;
  transactionType: string;
}

export interface CategorySpendApi {
  amount: number;
  name: string;
}

export interface SetupStatusApi {
  accounts: number;
  commitments: number;
  hasAccounts: boolean;
  hasCommitments: boolean;
  hasCycleSetting: boolean;
  hasIncomeTemplates: boolean;
  hasSavingsGoal: boolean;
  hasVaultLogin: boolean;
  incomeTemplates: number;
  isComplete: boolean;
}

export interface DashboardDataApi {
  creditCardDue: number;
  cycle: FinancialCycleApi;
  expensesThisCycle: number;
  primaryAccount: PrimaryAccountApi;
  recentActivity: RecentActivityApi[];
  remainingCommitments: number;
  safeToSpend: number;
  setup: SetupStatusApi;
  settlement: SettlementApi;
  spendingByCategory: CategorySpendApi[];
  summary: JsonObject;
}

export interface DashboardApiResponse {
  data: DashboardDataApi;
  generatedAt: string;
  vault: AuthenticatedVault;
}

export interface SuccessApiResponse {
  status: string;
}

export interface AccountApi {
  balance?: number | null;
  id: number;
  isPrimary: boolean;
  name: string;
  openingBalance: number;
  type: string;
}

export interface AccountPayloadApi {
  isPrimary?: boolean;
  name: string;
  openingBalance: number;
  type: string;
}

export interface CategoryApi {
  categoryType: string;
  emoji: string;
  id: number;
  isSystem: boolean;
  name: string;
  parentCategory?: string | null;
  transactionCount?: number | null;
}

export interface CategoryPayloadApi {
  categoryType: string;
  emoji: string;
  name: string;
}

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
