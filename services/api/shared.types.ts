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
