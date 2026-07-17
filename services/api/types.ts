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

export type SharedParticipantTupleApi = [number, string];
export type SharedCategoryTupleApi = [number, string, string];

export interface SharedExpenseApi {
  allocation_method: string;
  amount: number;
  category: string;
  category_icon: string;
  category_id: number;
  date: string;
  id: number;
  merchant: string;
  my_share: number;
  notes: string;
  other_share: number;
  paid_by: string;
  paid_by_id: number;
  settlement_amount: number;
  settlement_label: string;
  settlement_tone: string;
  split_label: string;
}

export interface SharedExpensesSummaryApi {
  paid_by_current: number;
  paid_by_other: number;
  total_shared_spend: number;
  total_transactions: number;
}

export interface SharedExpensesApiResponse {
  categories: SharedCategoryTupleApi[];
  current_participant?: SharedParticipantTupleApi | null;
  expenses: SharedExpenseApi[];
  other_participants: SharedParticipantTupleApi[];
  participants: SharedParticipantTupleApi[];
  summary: SharedExpensesSummaryApi;
}

export interface SharedBillShareApi {
  expected_amount: number;
  expected_percentage: number;
  participant_name: string;
  participant_vault_id: number;
}

export interface SharedBillInstanceApi {
  amount: number;
  bill_id: number;
  category_id?: number | null;
  category_name: string;
  due_date: string;
  frequency: string;
  icon: string;
  id: number;
  name: string;
  payer_name?: string | null;
  payer_vault_id?: number | null;
  payment_date?: string | null;
  payment_notes?: string | null;
  shares: SharedBillShareApi[];
  status: string;
  transaction_id?: number | null;
}

export interface SharedBillParticipantApi {
  difference: number;
  expected: number;
  income: number;
  name: string;
  paid: number;
  progress: number;
  ratio: number;
  vault_id: number;
}

export interface SharedBillCycleApi {
  display_name: string;
  end_date: string;
  id?: number | null;
  is_closed: boolean;
  month: number;
  shared_vault_id: number;
  start_date: string;
  status: string;
  year: number;
}

export interface SharedBillBalanceApi {
  amount: number;
  from: string;
  to: string;
}

export interface SharedBillsSummaryApi {
  balance: SharedBillBalanceApi[];
  next_due?: SharedBillInstanceApi | null;
  paid_amount: number;
  paid_count: number;
  pending_count: number;
  remaining_amount: number;
  total_amount: number;
  total_count: number;
}

export interface SharedBillsApiResponse {
  completed_bills: SharedBillInstanceApi[];
  cycle: SharedBillCycleApi;
  participants: SharedBillParticipantApi[];
  pending_bills: SharedBillInstanceApi[];
  summary: SharedBillsSummaryApi;
}

export interface SharedSettlementAccountApi {
  balance?: number | null;
  id: number;
  is_primary: boolean;
  name: string;
  type: string;
}

export interface SharedSettlementItemApi {
  amount: number;
  counterparty_name: string;
  counterparty_vault_id: number;
  direction: string;
  from_accounts: SharedSettlementAccountApi[];
  from_name: string;
  from_vault_id: number;
  label: string;
  shared_vault_id: number;
  shared_vault_name: string;
  to_accounts: SharedSettlementAccountApi[];
  to_name: string;
  to_vault_id: number;
}

export interface SharedSettlementsApiResponse {
  amount: number;
  direction: string;
  items: SharedSettlementItemApi[];
  label: string;
  net: number;
  payable: number;
  receivable: number;
}

export interface SharedSettlementPayloadApi {
  amount: number;
  fromAccountId: number;
  fromVaultId: number;
  settlementDate: string;
  sharedVaultId: number;
  toAccountId: number;
  toVaultId: number;
}

export interface SharedPageApiResponse<TData> {
  data: TData;
}
