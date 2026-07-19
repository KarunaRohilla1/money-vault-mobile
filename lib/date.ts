export function todayLocalIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isoDateParts(value: string): { day: number; month: number; year: number } | null {
  if (!isValidIsoDate(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");

  return {
    day: Number(dayText),
    month: Number(monthText),
    year: Number(yearText)
  };
}

export function isoDateFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function addMonthsToIsoDate(value: string, monthOffset: number): string {
  const parts = isoDateParts(value) ?? isoDateParts(todayLocalIso());

  if (!parts) {
    return todayLocalIso();
  }

  const monthStart = new Date(parts.year, parts.month - 1 + monthOffset, 1);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth() + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));

  return isoDateFromParts(year, month, day);
}

export function formatIsoDateOnly(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  if (!isValidIsoDate(value)) {
    return value;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(locale, options).format(date);
}
