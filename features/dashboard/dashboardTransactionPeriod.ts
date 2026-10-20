import { financialCycleContaining, isoDateInInclusiveRange } from "@/lib/financialCycle";
import { isoDateParts, todayLocalIso } from "@/lib/date";

export interface DashboardTransactionPeriodParams {
  dateFrom: string;
  dateTo: string;
  month: string;
}

export function dashboardTransactionPeriod(
  cycle: { endDate: string; startDate: string },
  referenceDate = new Date()
): DashboardTransactionPeriodParams {
  const today = todayLocalIso(referenceDate);
  const cycleStartDay = isoDateParts(cycle.startDate)?.day ?? 1;
  const containing = financialCycleContaining(today, cycleStartDay);
  const useDashboardCycle = isoDateInInclusiveRange(today, cycle.startDate, cycle.endDate);

  return {
    dateFrom: useDashboardCycle ? cycle.startDate : containing.startDate,
    dateTo: useDashboardCycle ? cycle.endDate : containing.endDate,
    month: today.slice(0, 7)
  };
}
