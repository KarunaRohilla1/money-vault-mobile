export interface PlanningStatusApi {
  actualAmount?: number | null;
  notes?: string | null;
  status: string;
}

export interface PlanningCycleApi {
  closedAt?: string | null;
  currentDay?: number;
  daysCompleted?: number;
  daysRemaining?: number;
  displayLabel?: string;
  displayMonth?: string;
  endDate: string;
  id: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  previousCycleStart?: string;
  progressPercent?: number;
  startDate: string;
  startMonth: number;
  startYear: number;
  status: string;
  totalDays?: number;
  nextCycleStart?: string;
  vaultId: number;
}

export interface PlanningCycleOptionApi {
  endDate: string;
  key: string;
  label: string;
  startDate: string;
  status: string;
  year: number;
}

export interface PlanningCycleNavigationApi {
  currentCycleStart: string;
  cycles: PlanningCycleOptionApi[];
  hasNextYear?: boolean;
  hasPreviousYear?: boolean;
  status?: string;
  year?: number | null;
}


export interface PlanningCycleProgressApi {
  currentDay: number;
  daysCompleted: number;
  daysRemaining: number;
  progressPercent: number;
  startLabel: string;
  status: string;
  totalDays: number;
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


export interface PlanningCompletionApi {
  attentionCount: number;
  commitmentCompletionPercent: number;
  incomeCompletionPercent: number;
  status: "on_track" | "warning" | "behind";
  statusLabel: string;
  subtitle: string;
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


export interface PlanningActivityApi extends PlanningItemApi {
  actualAmount: number;
  completeLabel: string;
  completeStatus: "RECEIVED" | "PAID";
  dueDate: string;
  effectiveExpectedAmount: number;
  icon: string;
  kind: "income" | "commitment";
  statusLabel: string;
  timelineLabel: string;
}

export interface PlanningCloseReadinessApi {
  canClose: boolean;
  completedCount: number;
  pendingCount: number;
  reviewRequired: boolean;
  totalCount: number;
}
export interface PlanningApiResponse {
  activities?: PlanningActivityApi[];
  closeReadiness?: PlanningCloseReadinessApi;
  completion?: PlanningCompletionApi;
  commitments: PlanningItemApi[];
  cycle: PlanningCycleApi;
  cycleNavigation?: PlanningCycleNavigationApi;
  cycleProgress?: PlanningCycleProgressApi;
  incomeTemplates: PlanningItemApi[];
  timeline?: PlanningActivityApi[];
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

export interface PlanningCloseItemPayloadApi {
  action: "Paid" | "Cancelled" | "Carry Forward";
  amount: number;
  id: number;
  type: "income" | "commitment";
}

export interface PlanningClosePayloadApi {
  items: PlanningCloseItemPayloadApi[];
}
