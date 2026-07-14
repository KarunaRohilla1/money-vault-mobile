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
