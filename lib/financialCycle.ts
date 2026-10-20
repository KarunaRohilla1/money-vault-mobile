import { addMonthsToIsoDate, daysInMonth, isoDateFromParts, isoDateParts, todayLocalIso } from "@/lib/date";

export interface FinancialCycleBounds {
  endDate: string;
  startDate: string;
}

function clampCycleStartDay(year: number, month: number, cycleStartDay: number) {
  const day = Number.isInteger(cycleStartDay) ? cycleStartDay : 1;
  return Math.min(Math.max(day, 1), daysInMonth(year, month));
}

export function financialCycleContaining(isoDate: string, cycleStartDay: number): FinancialCycleBounds {
  const parts = isoDateParts(isoDate) ?? isoDateParts(todayLocalIso());
  if (!parts) {
    return { endDate: isoDate, startDate: isoDate };
  }

  const startThisMonth = cycleStartForMonth(parts.year, parts.month, cycleStartDay);
  const startDate =
    isoDate >= startThisMonth
      ? startThisMonth
      : cycleStartForMonthOffset(parts.year, parts.month, cycleStartDay, -1);

  return {
    startDate,
    endDate: cycleStartForMonthOffset(
      isoDateParts(startDate)?.year ?? parts.year,
      isoDateParts(startDate)?.month ?? parts.month,
      cycleStartDay,
      1
    )
  };
}

function cycleStartForMonth(year: number, month: number, cycleStartDay: number) {
  return isoDateFromParts(year, month, clampCycleStartDay(year, month, cycleStartDay));
}

function cycleStartForMonthOffset(year: number, month: number, cycleStartDay: number, monthOffset: number) {
  const shifted = isoDateParts(addMonthsToIsoDate(isoDateFromParts(year, month, 1), monthOffset));
  if (!shifted) {
    return cycleStartForMonth(year, month, cycleStartDay);
  }
  return cycleStartForMonth(shifted.year, shifted.month, cycleStartDay);
}

export function isoDateInInclusiveRange(isoDate: string, startDate: string, endDate: string) {
  return isoDate >= startDate && isoDate <= endDate;
}
