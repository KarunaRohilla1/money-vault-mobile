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
