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

export interface PlanningStatusApi {
  actualAmount?: number | null;
  notes?: string | null;
  status: string;
}

export interface PlanningCycleApi {
  endDate: string;
  id: number;
  startDate: string;
  startMonth: number;
  startYear: number;
  status: string;
  vaultId: number;
}

export interface PlanningTotalsApi {
  commitmentsCompleted: number;
  commitmentsPlanned: number;
  expenses: number;
  income: number;
  incomePlanned: number;
  incomeReceived: number;
  plannedCommitments: number;
  projectedSavings: number;
  remainingCommitments: number;
  savingsGoal: number;
}

export interface PlanningItemApi {
  accountId?: number | null;
  accountName?: string | null;
  amount: number;
  dueDay: number;
  id: number;
  name: string;
  status: PlanningStatusApi;
}

export interface PlanningApiResponse {
  commitments: PlanningItemApi[];
  cycle: PlanningCycleApi;
  incomeTemplates: PlanningItemApi[];
  totals: PlanningTotalsApi;
}

export interface PlanningItemPayloadApi {
  accountId: number;
  amount: number;
  dueDay: number;
  name: string;
}

export interface PlanningStatusPayloadApi {
  actualAmount?: number | null;
  month: number;
  notes?: string;
  status: string;
  year: number;
}

export interface WishlistCategoryApi {
  id: number;
  name: string;
  vaultId: number;
}

export interface WishlistItemApi {
  accountId?: number | null;
  accountName?: string | null;
  category: string;
  estimatedCost: number;
  id: number;
  imageUrl: string;
  name: string;
  notes: string;
  progressPercent: number;
  savedAmount: number;
  targetDate?: string | null;
}

export interface WishlistSummaryApi {
  progress: number;
  totalCost: number;
  totalItems: number;
  totalSaved: number;
}

export interface WishlistApiResponse {
  categories: WishlistCategoryApi[];
  items: WishlistItemApi[];
  summary: WishlistSummaryApi;
}

export interface WishlistItemPayloadApi {
  accountId?: number | null;
  category: string;
  estimatedCost: number;
  imageUrl?: string;
  name: string;
  notes?: string;
  savedAmount?: number;
  targetDate?: string | null;
}

export interface ReportsApiResponse {
  categoryBreakdown: JsonObject[];
  generatedAt: string;
  monthlyTrend: JsonObject[];
  period: JsonObject;
  summary: JsonObject;
}

export interface VaultSummaryApi {
  id: number;
  isAdmin: boolean;
  name: string;
  vaultType: string;
}

export interface SettingsApiResponse {
  accessibleVaults: VaultSummaryApi[];
  currentVault: VaultSummaryApi;
  cycleStartDay: number;
  monthlySavingsGoal: number;
}
